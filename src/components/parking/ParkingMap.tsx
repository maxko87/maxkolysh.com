// ParkingMap — placeholder for future map visualization
// Will show car location pin + nearby street segments

interface ParkingMapProps {
  latitude: number;
  longitude: number;
  streetName?: string;
}

export default function ParkingMap({ latitude, longitude, streetName }: ParkingMapProps) {
  return (
    <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="aspect-video flex flex-col items-center justify-center gap-2 text-zinc-500">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <p className="text-sm">
          {streetName ? `📍 ${streetName}` : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
        </p>
        <p className="text-xs text-zinc-600">Map view coming soon</p>
      </div>
    </div>
  );
}
