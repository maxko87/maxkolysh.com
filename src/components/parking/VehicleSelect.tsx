import type { TeslaVehicle } from '../../utils/tesla';

interface VehicleSelectProps {
  vehicles: TeslaVehicle[];
  onSelect: (vehicle: TeslaVehicle) => void;
  loading?: boolean;
}

export default function VehicleSelect({ vehicles, onSelect, loading }: VehicleSelectProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-zinc-400">Loading your vehicles...</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center space-y-3">
        <p className="text-zinc-400">No vehicles found on your Tesla account.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <h2 className="text-2xl font-bold text-white">Select Your Vehicle</h2>
      <div className="w-full space-y-3">
        {vehicles.map((vehicle) => (
          <button
            key={vehicle.id}
            onClick={() => onSelect(vehicle)}
            className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/60" fill="currentColor">
                <path d="M5 13l1.5-4.5C7 7 8.5 6 10 6h4c1.5 0 3 1 3.5 2.5L19 13M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-4M5 13h14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7.5" cy="15.5" r="1" fill="currentColor"/>
                <circle cx="16.5" cy="15.5" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{vehicle.display_name || 'Tesla Vehicle'}</p>
              <p className="text-sm text-zinc-500">{vehicle.vin}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${vehicle.state === 'online' ? 'bg-green-400' : 'bg-zinc-600'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
