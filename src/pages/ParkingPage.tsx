import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeslaConnect from '../components/parking/TeslaConnect';
import VehicleSelect from '../components/parking/VehicleSelect';
import CleaningSchedule from '../components/parking/CleaningSchedule';
import {
  validateOAuthCallback,
  exchangeCode,
  storeTokens,
  getAccessToken,
  getVehicles,
  getLocationWithWake,
  clearTokens,
} from '../utils/tesla';
import type { TeslaVehicle, VehicleLocation } from '../utils/tesla';
import {
  fetchNeighborhoods,
  findNeighborhood,
  fetchNeighborhoodData,
  findNearestSegment,
} from '../utils/streetCleaning';
import type { NearestSegmentResult } from '../utils/streetCleaning';

type PageState =
  | 'landing'
  | 'connecting'
  | 'authenticated'
  | 'selecting_vehicle'
  | 'loading_location'
  | 'loading_schedule'
  | 'results'
  | 'error';

export default function ParkingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<PageState>('landing');
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<TeslaVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<TeslaVehicle | null>(null);
  const [_location, setLocation] = useState<VehicleLocation | null>(null);
  const [result, setResult] = useState<NearestSegmentResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [startOverHovered, setStartOverHovered] = useState(false);
  const [errorBtnHovered, setErrorBtnHovered] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');

    if (code && stateParam) {
      handleOAuthCallback();
    } else if (getAccessToken()) {
      setState('authenticated');
      loadVehicles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOAuthCallback() {
    setState('connecting');
    setStatusMessage('Exchanging authorization code...');

    const validation = validateOAuthCallback(searchParams);

    if ('error' in validation) {
      setError(validation.error);
      setState('error');
      return;
    }

    try {
      setSearchParams({}, { replace: true });
      const tokens = await exchangeCode(validation.code);
      storeTokens(tokens);
      setState('authenticated');
      await loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate with Tesla');
      setState('error');
    }
  }

  async function loadVehicles() {
    setState('selecting_vehicle');
    setStatusMessage('Loading your vehicles...');

    try {
      const vehicleList = await getVehicles();
      setVehicles(vehicleList);

      if (vehicleList.length === 1) {
        await handleVehicleSelect(vehicleList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
      setState('error');
    }
  }

  const handleVehicleSelect = useCallback(async (vehicle: TeslaVehicle) => {
    setSelectedVehicle(vehicle);
    setState('loading_location');
    setStatusMessage('Waking up your car and getting location...');

    try {
      const loc = await getLocationWithWake(vehicle.id, 6, setStatusMessage);
      console.log('[Parking] Vehicle location:', { lat: loc.latitude, lng: loc.longitude, heading: loc.heading, timestamp: loc.timestamp });
      // Temporary debug — show location to user
      setStatusMessage(`Car found at ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)} — looking up schedule...`);
      setLocation(loc);
      await loadCleaningSchedule(loc.latitude, loc.longitude);
    } catch (err) {
      console.error('[Parking] Failed to get vehicle location:', err);
      setError(err instanceof Error ? err.message : 'Failed to get vehicle location');
      setState('error');
    }
  }, []);

  async function loadCleaningSchedule(lat: number, lng: number) {
    setState('loading_schedule');
    setStatusMessage('Finding street cleaning schedule...');

    try {
      console.log('[Parking] Fetching neighborhood boundaries...');
      const neighborhoods = await fetchNeighborhoods();
      console.log('[Parking] Loaded neighborhoods:', neighborhoods.features.length, 'total');
      
      const neighborhood = findNeighborhood(lat, lng, neighborhoods);
      console.log('[Parking] Point-in-polygon result for', { lat, lng }, '→ neighborhood:', neighborhood);

      if (!neighborhood) {
        console.warn('[Parking] No neighborhood found! Listing all neighborhood names for debug:',
          neighborhoods.features.map((f: any) => f.properties?.name || f.properties?.nhood || f.properties?.neighborhood || JSON.stringify(Object.keys(f.properties || {}))).slice(0, 10));
        setError(`Your car appears to be at (${lat.toFixed(5)}, ${lng.toFixed(5)}) which is outside SF city limits. This tool only works within SF.`);
        setState('error');
        return;
      }

      console.log('[Parking] Fetching street data for neighborhood:', neighborhood);
      const streetData = await fetchNeighborhoodData(neighborhood);
      console.log('[Parking] Loaded street segments:', streetData.features.length);
      
      const nearest = findNearestSegment(lat, lng, streetData);
      console.log('[Parking] Nearest segment:', nearest ? {
        street: nearest.feature.properties.Corridor,
        limits: nearest.feature.properties.Limits,
        distance: nearest.distance,
        sides: nearest.sides.map(s => s.label),
      } : 'NONE FOUND');

      if (!nearest) {
        setError('Could not find a nearby street segment with cleaning data.');
        setState('error');
        return;
      }

      setResult(nearest);
      setState('results');
    } catch (err) {
      console.error('[Parking] Schedule loading failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cleaning schedule');
      setState('error');
    }
  }

  async function handleRefresh() {
    if (!selectedVehicle) return;
    setRefreshing(true);

    try {
      const loc = await getLocationWithWake(selectedVehicle.id);
      setLocation(loc);
      await loadCleaningSchedule(loc.latitude, loc.longitude);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh location');
      setState('error');
    } finally {
      setRefreshing(false);
    }
  }

  function handleStartOver() {
    clearTokens();
    setError(null);
    setVehicles([]);
    setSelectedVehicle(null);
    setLocation(null);
    setResult(null);
    setState('landing');
  }

  const isLoading = state === 'connecting' || state === 'authenticated' || state === 'loading_location' || state === 'loading_schedule';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      background: 'linear-gradient(180deg, #09090b 0%, #111114 50%, #0a0a0c 100%)',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background pattern */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(232, 33, 39, 0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Landing state */}
        {state === 'landing' && (
          <TeslaConnect onConnecting={() => setState('connecting')} />
        )}

        {/* Loading states */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '36px', height: '36px',
              border: '2.5px solid rgba(255,255,255,0.1)',
              borderTopColor: '#e82127',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>{statusMessage}</p>

          </div>
        )}

        {/* Vehicle selection */}
        {state === 'selecting_vehicle' && (
          <VehicleSelect
            vehicles={vehicles}
            onSelect={handleVehicleSelect}
            loading={vehicles.length === 0}
          />
        )}

        {/* Results */}
        {state === 'results' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '32rem' }}>
            <CleaningSchedule
              result={result}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
            <button
              onClick={handleStartOver}
              onMouseEnter={() => setStartOverHovered(true)}
              onMouseLeave={() => setStartOverHovered(false)}
              style={{
                fontSize: '0.8rem',
                color: startOverHovered ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: '0.5rem',
              }}
            >
              Disconnect & Start Over
            </button>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', maxWidth: '28rem', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>Something went wrong</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>{error}</p>
            <button
              onClick={handleStartOver}
              onMouseEnter={() => setErrorBtnHovered(true)}
              onMouseLeave={() => setErrorBtnHovered(false)}
              style={{
                padding: '0.65rem 1.5rem',
                background: errorBtnHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                color: '#fff',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
              }}
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
