// Tesla OAuth2 + Fleet API helpers

const TESLA_AUTH_URL = 'https://auth.tesla.com/oauth2/v3/authorize';
// All Fleet API calls are proxied through Supabase Edge Function to avoid CORS
const TESLA_CLIENT_ID = import.meta.env.VITE_TESLA_CLIENT_ID || '';
const TESLA_REDIRECT_URI = `${window.location.origin}/parking`;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface TeslaTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  email?: string;
  tesla_user_id?: string;
}

export interface TeslaVehicle {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  state: string;
}

export interface VehicleLocation {
  latitude: number;
  longitude: number;
  heading: number;
  timestamp: number;
}

// Generate a random state parameter for CSRF protection
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Initiate Tesla OAuth2 flow
export function startTeslaOAuth(): void {
  const state = generateState();
  sessionStorage.setItem('tesla_oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TESLA_CLIENT_ID,
    redirect_uri: TESLA_REDIRECT_URI,
    scope: 'openid profile email vehicle_device_data vehicle_location offline_access',
    state,
    prompt: 'consent',
    prompt_missing_scopes: 'true',
    require_requested_scopes: 'true',
  });

  window.location.href = `${TESLA_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens via Supabase Edge Function
export async function exchangeCode(code: string): Promise<TeslaTokens> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/tesla-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      code,
      redirect_uri: TESLA_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// Validate OAuth callback parameters
export function validateOAuthCallback(searchParams: URLSearchParams): { code: string } | { error: string } {
  const error = searchParams.get('error');
  if (error) {
    return { error: searchParams.get('error_description') || error };
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const savedState = sessionStorage.getItem('tesla_oauth_state');

  if (!code) {
    return { error: 'No authorization code received' };
  }

  if (state !== savedState) {
    return { error: 'Invalid state parameter — possible CSRF attack' };
  }

  sessionStorage.removeItem('tesla_oauth_state');
  return { code };
}

// Store tokens in sessionStorage
export function storeTokens(tokens: TeslaTokens): void {
  sessionStorage.setItem('tesla_access_token', tokens.access_token);
  sessionStorage.setItem('tesla_refresh_token', tokens.refresh_token);
  sessionStorage.setItem('tesla_token_expires', String(Date.now() + tokens.expires_in * 1000));
  if (tokens.email) sessionStorage.setItem('tesla_email', tokens.email);
  if (tokens.tesla_user_id) sessionStorage.setItem('tesla_user_id', tokens.tesla_user_id);
}

export function getStoredEmail(): string | null {
  return sessionStorage.getItem('tesla_email');
}

export function getStoredUserId(): string | null {
  return sessionStorage.getItem('tesla_user_id');
}

// Get stored access token
export function getAccessToken(): string | null {
  const token = sessionStorage.getItem('tesla_access_token');
  const expires = sessionStorage.getItem('tesla_token_expires');

  if (!token || !expires) return null;
  if (Date.now() > Number(expires)) return null;

  return token;
}

// Clear stored tokens
export function clearTokens(): void {
  sessionStorage.removeItem('tesla_access_token');
  sessionStorage.removeItem('tesla_refresh_token');
  sessionStorage.removeItem('tesla_token_expires');
}

// Make authenticated Fleet API request via Supabase proxy (avoids CORS)
async function fleetApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const proxyUrl = `${SUPABASE_URL}/functions/v1/tesla-proxy?path=${encodeURIComponent(path)}`;

  const response = await fetch(proxyUrl, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-Tesla-Token': token,
    },
    body: options.method === 'POST' ? options.body : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fleet API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.response;
}

// Save location to backend so cron job has initial/updated coordinates
export async function saveLocationToBackend(teslaUserId: string, latitude: number, longitude: number): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/tesla-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        endpoint: '_internal/save-location',
        body: { tesla_user_id: teslaUserId, latitude, longitude },
      }),
    });
  } catch (e) {
    console.warn('Failed to save location to backend:', e);
  }
}

// Get list of vehicles
export async function getVehicles(): Promise<TeslaVehicle[]> {
  return fleetApiRequest<TeslaVehicle[]>('/api/1/vehicles');
}

// Wake up a vehicle
export async function wakeVehicle(vehicleId: number): Promise<void> {
  await fleetApiRequest(`/api/1/vehicles/${vehicleId}/wake_up`, { method: 'POST' });
}

// Get vehicle location
export async function getVehicleLocation(vehicleId: number): Promise<VehicleLocation> {
  const data = await fleetApiRequest<{ drive_state: VehicleLocation }>(
    `/api/1/vehicles/${vehicleId}/vehicle_data?endpoints=location_data`
  );
  return data.drive_state;
}

// Wake vehicle and get location (with retries)
// Tesla cars can take 15-30s to wake up, so we retry with increasing delays
export async function getLocationWithWake(
  vehicleId: number,
  maxRetries = 6,
  onStatus?: (msg: string) => void,
): Promise<VehicleLocation> {
  // First try — maybe car is already awake
  try {
    return await getVehicleLocation(vehicleId);
  } catch {
    // Car is asleep, wake it up
    onStatus?.('Your car is asleep. Waking it up...');
    try {
      await wakeVehicle(vehicleId);
    } catch {
      // wake_up can fail too if car is offline, keep trying
    }
  }

  // Retry with 5s intervals — car typically wakes in 10-30s
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    onStatus?.(`Waiting for car to wake up... (${attempt + 1}/${maxRetries})`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      return await getVehicleLocation(vehicleId);
    } catch {
      if (attempt === Math.floor(maxRetries / 2)) {
        // Try waking again halfway through
        onStatus?.('Still waiting... sending another wake command...');
        try { await wakeVehicle(vehicleId); } catch { /* ignore */ }
      }
      if (attempt === maxRetries - 1) {
        throw new Error('Your car didn\'t wake up after 30 seconds. Make sure it has cell service and try again.');
      }
    }
  }
  throw new Error('Failed to get vehicle location after retries');
}
