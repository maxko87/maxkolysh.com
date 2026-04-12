import { useState, useEffect, useCallback } from 'react';
import { getTeslaAuthUrl, exchangeCode, getVehicles, getVehicleLocation, type TeslaVehicle, type TeslaTokens } from '../utils/tesla';
import { findCleaningSchedule, type CleaningResult } from '../utils/streetCleaning';
import { supabase } from '../utils/supabase';

type Step = 'landing' | 'loading' | 'vehicles' | 'locating' | 'result' | 'error';

export default function ParkingPage() {
  const [step, setStep] = useState<Step>('landing');
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TeslaTokens | null>(null);
  const [vehicles, setVehicles] = useState<TeslaVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<TeslaVehicle | null>(null);
  const [cleaning, setCleaning] = useState<CleaningResult | null>(null);
  const [notifPrefs, setNotifPrefs] = useState({
    '1h': true,
    '3h': false,
    '1d': false,
    '2d': false,
  });
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Handle OAuth callback
  const handleCallback = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const savedState = sessionStorage.getItem('tesla_oauth_state');

    if (!code) return false;

    // Clear URL params
    window.history.replaceState({}, '', '/parking');

    if (state !== savedState) {
      setError('OAuth state mismatch — please try again.');
      setStep('error');
      return true;
    }

    setStep('loading');
    setStatusMsg('Exchanging authorization code...');

    try {
      const tokenData = await exchangeCode(code);
      setTokens(tokenData);
      sessionStorage.setItem('tesla_tokens', JSON.stringify(tokenData));

      setStatusMsg('Loading your vehicles...');
      const vehicleList = await getVehicles(tokenData.access_token);
      setVehicles(vehicleList);

      if (vehicleList.length === 1) {
        setSelectedVehicle(vehicleList[0]);
        await fetchLocation(tokenData, vehicleList[0]);
      } else if (vehicleList.length > 1) {
        setStep('vehicles');
      } else {
        setError('No vehicles found on your Tesla account.');
        setStep('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Tesla');
      setStep('error');
    }

    return true;
  }, []);

  const fetchLocation = async (tokenData: TeslaTokens, vehicle: TeslaVehicle) => {
    setStep('locating');
    setStatusMsg('Waking up your Tesla...');

    try {
      setStatusMsg('Getting vehicle location...');
      const location = await getVehicleLocation(tokenData.access_token, vehicle.id);

      setStatusMsg('Finding street cleaning schedule...');
      const result = await findCleaningSchedule(location.latitude, location.longitude);
      setCleaning(result);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get vehicle location');
      setStep('error');
    }
  };

  const handleSelectVehicle = async (vehicle: TeslaVehicle) => {
    setSelectedVehicle(vehicle);
    if (tokens) {
      await fetchLocation(tokens, vehicle);
    }
  };

  const handleSavePrefs = async () => {
    if (!tokens?.tesla_user_id || !selectedVehicle) return;

    try {
      const { error: dbError } = await supabase
        .from('tesla_users')
        .update({
          notification_prefs: notifPrefs,
          vehicle_id: String(selectedVehicle.id),
        })
        .eq('tesla_user_id', tokens.tesla_user_id);

      if (dbError) throw dbError;
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save prefs:', err);
      setError('Failed to save notification preferences');
    }
  };

  useEffect(() => {
    // Check for OAuth callback
    handleCallback().then(wasCallback => {
      if (!wasCallback) {
        // Check for existing session
        const saved = sessionStorage.getItem('tesla_tokens');
        if (saved) {
          try {
            const t = JSON.parse(saved) as TeslaTokens;
            setTokens(t);
            // Don't auto-fetch — let them click
          } catch {
            sessionStorage.removeItem('tesla_tokens');
          }
        }
      }
    });
  }, [handleCallback]);

  const startOver = () => {
    sessionStorage.removeItem('tesla_tokens');
    sessionStorage.removeItem('tesla_oauth_state');
    setTokens(null);
    setVehicles([]);
    setSelectedVehicle(null);
    setCleaning(null);
    setError(null);
    setStep('landing');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#e5e5e5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <a href="/" style={{ color: '#737373', textDecoration: 'none', fontSize: 14 }}>
            ← maxkolysh.com
          </a>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 16, color: '#fff' }}>
            🚗 SF Street Cleaning
          </h1>
          <p style={{ color: '#a3a3a3', marginTop: 8, fontSize: 15 }}>
            Never get a street cleaning ticket again
          </p>
        </div>

        {/* Landing */}
        {step === 'landing' && !tokens && (
          <Card>
            <p style={{ color: '#a3a3a3', marginBottom: 24, lineHeight: 1.6 }}>
              Connect your Tesla to automatically detect where you're parked
              and get email reminders before street cleaning.
            </p>
            <button onClick={() => window.location.href = getTeslaAuthUrl()} style={primaryBtn}>
              Connect Tesla
            </button>
            <p style={{ color: '#525252', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
              We request location access and your email for notifications.
              Your data is never shared.
            </p>
          </Card>
        )}

        {/* Returning user with saved tokens */}
        {step === 'landing' && tokens && (
          <Card>
            <p style={{ color: '#a3a3a3', marginBottom: 16 }}>
              Welcome back{tokens.email ? `, ${tokens.email}` : ''}!
            </p>
            <button
              onClick={async () => {
                setStep('loading');
                setStatusMsg('Loading vehicles...');
                try {
                  const vehicleList = await getVehicles(tokens.access_token);
                  setVehicles(vehicleList);
                  if (vehicleList.length === 1) {
                    setSelectedVehicle(vehicleList[0]);
                    await fetchLocation(tokens, vehicleList[0]);
                  } else {
                    setStep('vehicles');
                  }
                } catch {
                  setError('Session expired — please reconnect.');
                  setStep('error');
                }
              }}
              style={primaryBtn}
            >
              Check My Car
            </button>
            <button onClick={startOver} style={{ ...secondaryBtn, marginTop: 12 }}>
              Start Over
            </button>
          </Card>
        )}

        {/* Loading */}
        {(step === 'loading' || step === 'locating') && (
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={spinner} />
              <p style={{ color: '#a3a3a3', marginTop: 16 }}>{statusMsg}</p>
              {step === 'locating' && (
                <p style={{ color: '#525252', fontSize: 13, marginTop: 8 }}>
                  This may take up to 30 seconds if your car is asleep...
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Vehicle selection */}
        {step === 'vehicles' && (
          <Card>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#fff' }}>
              Select Vehicle
            </h2>
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => handleSelectVehicle(v)}
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  border: '1px solid #333',
                  marginBottom: 8,
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 600, color: '#fff' }}>{v.display_name}</div>
                <div style={{ color: '#737373', fontSize: 13 }}>VIN: {v.vin}</div>
              </button>
            ))}
          </Card>
        )}

        {/* Result */}
        {step === 'result' && (
          <>
            <Card>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#fff' }}>
                {selectedVehicle?.display_name}
              </h2>

              {cleaning ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <Label>Location</Label>
                    <p style={{ color: '#e5e5e5', margin: '4px 0' }}>
                      {cleaning.streetName} ({cleaning.side} side)
                    </p>
                    <p style={{ color: '#737373', fontSize: 13 }}>
                      {cleaning.neighborhoodName} · {Math.round(cleaning.distance)}m from street
                    </p>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <Label>Next Cleaning</Label>
                    {cleaning.nextCleaning ? (
                      <p style={{
                        color: '#fff',
                        fontSize: 20,
                        fontWeight: 700,
                        margin: '4px 0',
                      }}>
                        {formatNextCleaning(cleaning.nextCleaning)}
                      </p>
                    ) : (
                      <p style={{ color: '#22c55e', margin: '4px 0' }}>
                        No upcoming cleaning scheduled ✓
                      </p>
                    )}
                  </div>

                  {cleaning.recurringPattern && (
                    <div style={{ marginBottom: 20 }}>
                      <Label>Recurring Schedule</Label>
                      <p style={{ color: '#a3a3a3', margin: '4px 0' }}>
                        {cleaning.recurringPattern}
                      </p>
                    </div>
                  )}

                  {cleaning.nextCleaning && (
                    <a
                      href={buildCalendarUrl(cleaning)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...secondaryBtn, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}
                    >
                      📅 Add to Google Calendar
                    </a>
                  )}
                </>
              ) : (
                <p style={{ color: '#f59e0b' }}>
                  Could not find street cleaning data for this location.
                  Your car may be outside SF or in an area without scheduled cleaning.
                </p>
              )}
            </Card>

            {/* Notification preferences */}
            {cleaning?.nextCleaning && tokens?.email && (
              <Card style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: '#fff' }}>
                  Email Reminders
                </h2>
                <p style={{ color: '#737373', fontSize: 13, marginBottom: 16 }}>
                  We'll email {tokens.email} before street cleaning
                </p>

                {Object.entries({
                  '1h': '1 hour before',
                  '3h': '3 hours before',
                  '1d': '1 day before',
                  '2d': '2 days before',
                }).map(([key, label]) => (
                  <label key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid #1f1f1f',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={notifPrefs[key as keyof typeof notifPrefs]}
                      onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: '#3b82f6' }}
                    />
                    <span style={{ color: '#e5e5e5' }}>{label}</span>
                  </label>
                ))}

                <button onClick={handleSavePrefs} style={{ ...primaryBtn, marginTop: 20 }}>
                  {prefsSaved ? '✓ Saved!' : 'Save Preferences'}
                </button>
              </Card>
            )}

            <button onClick={startOver} style={{ ...secondaryBtn, marginTop: 16, width: '100%' }}>
              Start Over
            </button>
          </>
        )}

        {/* Error */}
        {step === 'error' && (
          <Card>
            <p style={{ color: '#ef4444', marginBottom: 16 }}>
              {error || 'Something went wrong.'}
            </p>
            <button onClick={startOver} style={primaryBtn}>
              Try Again
            </button>
          </Card>
        )}

        <p style={{ textAlign: 'center', color: '#404040', fontSize: 12, marginTop: 40 }}>
          Data from SF DPW via{' '}
          <a href="https://github.com/kaushalpartani/sf-street-cleaning" target="_blank" rel="noopener noreferrer" style={{ color: '#525252' }}>
            sf-street-cleaning
          </a>
        </p>
      </div>
    </div>
  );
}

// Components & styles
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...cardStyle, ...style }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1 }}>
      {children}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  borderRadius: 12,
  padding: 24,
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '12px 20px',
  backgroundColor: 'transparent',
  color: '#a3a3a3',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 14,
  cursor: 'pointer',
};

const spinner: React.CSSProperties = {
  width: 32,
  height: 32,
  border: '3px solid #333',
  borderTopColor: '#3b82f6',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  margin: '0 auto',
};

// Add spinner keyframes
if (typeof document !== 'undefined' && !document.getElementById('parking-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'parking-spinner-style';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg) } }';
  document.head.appendChild(style);
}

function formatNextCleaning(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function buildCalendarUrl(cleaning: CleaningResult): string {
  if (!cleaning.nextCleaning) return '#';
  
  const date = new Date(cleaning.nextCleaning);
  const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000); // +2hrs
  
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🚗 Move Car - Street Cleaning (${cleaning.streetName})`,
    dates: `${fmt(date)}/${fmt(endDate)}`,
    details: `Street cleaning on ${cleaning.streetName} (${cleaning.side} side) in ${cleaning.neighborhoodName}.`,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
