import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeslaConnect from '../components/parking/TeslaConnect';
import VehicleSelect from '../components/parking/VehicleSelect';
import CleaningSchedule from '../components/parking/CleaningSchedule';
import ParkingMap from '../components/parking/ParkingMap';
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
  const [location, setLocation] = useState<VehicleLocation | null>(null);
  const [result, setResult] = useState<NearestSegmentResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Handle OAuth callback on mount
  useEffect(() => {
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');

    if (code && stateParam) {
      handleOAuthCallback();
    } else if (getAccessToken()) {
      // Already have valid tokens — go to vehicle selection
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
      // Clean URL
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

      // Auto-select if only one vehicle
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
      const loc = await getLocationWithWake(vehicle.id);
      setLocation(loc);
      await loadCleaningSchedule(loc.latitude, loc.longitude);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get vehicle location');
      setState('error');
    }
  }, []);

  async function loadCleaningSchedule(lat: number, lng: number) {
    setState('loading_schedule');
    setStatusMessage('Finding street cleaning schedule...');

    try {
      const neighborhoods = await fetchNeighborhoods();
      const neighborhood = findNeighborhood(lat, lng, neighborhoods);

      if (!neighborhood) {
        setError('Your car does not appear to be parked in San Francisco. This tool only works within SF city limits.');
        setState('error');
        return;
      }

      const streetData = await fetchNeighborhoodData(neighborhood);
      const nearest = findNearestSegment(lat, lng, streetData);

      if (!nearest) {
        setError('Could not find a nearby street segment with cleaning data.');
        setState('error');
        return;
      }

      setResult(nearest);
      setState('results');
    } catch (err) {
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

  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Landing state */}
      {state === 'landing' && (
        <TeslaConnect onConnecting={() => setState('connecting')} />
      )}

      {/* Connecting / Loading states */}
      {(state === 'connecting' || state === 'authenticated' || state === 'loading_location' || state === 'loading_schedule') && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-400">{statusMessage}</p>
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
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
          {location && (
            <ParkingMap
              latitude={location.latitude}
              longitude={location.longitude}
              streetName={result.feature.properties.Corridor}
            />
          )}
          <CleaningSchedule
            result={result}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
          <button
            onClick={handleStartOver}
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          >
            Disconnect & Start Over
          </button>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-zinc-400">{error}</p>
          <button
            onClick={handleStartOver}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors cursor-pointer"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
