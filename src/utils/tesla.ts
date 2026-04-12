const TESLA_CLIENT_ID = '39a99319-b708-4245-a29f-6907373f37ad';
const REDIRECT_URI = 'https://maxkolysh.com/parking';
const SUPABASE_URL = 'https://vjnkdpovepqlsrdzqowd.supabase.co';

// Scopes: profile for email, location + device_data for car position
const SCOPES = 'openid profile email vehicle_device_data vehicle_location offline_access';

export function getTeslaAuthUrl(): string {
  const state = crypto.randomUUID();
  sessionStorage.setItem('tesla_oauth_state', state);
  
  const params = new URLSearchParams({
    client_id: TESLA_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    state,
    prompt: 'consent',
    require_requested_scopes: 'true',
  });
  
  return `https://auth.tesla.com/oauth2/v3/authorize?${params.toString()}`;
}

export interface TeslaTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  email?: string;
  tesla_user_id?: string;
}

export async function exchangeCode(code: string): Promise<TeslaTokens> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tesla-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  
  return res.json();
}

export async function teslaApiCall(
  endpoint: string,
  token: string,
  method: string = 'GET',
  body?: unknown
): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tesla-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, method, token, body }),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tesla API error: ${err}`);
  }
  
  return res.json();
}

export interface TeslaVehicle {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
}

export async function getVehicles(token: string): Promise<TeslaVehicle[]> {
  const data = await teslaApiCall('vehicles', token) as { response: TeslaVehicle[] };
  return data.response || [];
}

export async function wakeVehicle(token: string, vehicleId: number): Promise<boolean> {
  for (let i = 0; i < 6; i++) {
    try {
      const data = await teslaApiCall(`vehicles/${vehicleId}/wake_up`, token, 'POST') as { response: { state: string } };
      if (data.response?.state === 'online') return true;
    } catch {
      // retry
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  return false;
}

export interface VehicleLocation {
  latitude: number;
  longitude: number;
  heading: number;
}

export async function getVehicleLocation(token: string, vehicleId: number): Promise<VehicleLocation> {
  // Try to wake the car first
  await wakeVehicle(token, vehicleId);
  
  const data = await teslaApiCall(
    `vehicles/${vehicleId}/vehicle_data?endpoints=location_data`,
    token
  ) as { response: { drive_state: { latitude: number; longitude: number; heading: number } } };
  
  const ds = data.response.drive_state;
  return {
    latitude: ds.latitude,
    longitude: ds.longitude,
    heading: ds.heading,
  };
}

export async function saveNotificationPrefs(
  teslaUserId: string,
  vehicleId: string,
  prefs: Record<string, boolean>
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tesla-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: '_internal/save-prefs',
      method: 'POST',
      token: '',
      body: { tesla_user_id: teslaUserId, vehicle_id: vehicleId, notification_prefs: prefs },
    }),
  });
  
  if (!res.ok) throw new Error('Failed to save preferences');
}
