// ParkingMap — placeholder for future map visualization
// Will show car location pin + nearby street segments

interface ParkingMapProps {
  latitude: number;
  longitude: number;
  streetName?: string;
}

export default function ParkingMap({ latitude, longitude, streetName }: ParkingMapProps) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '32rem',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      <div style={{
        aspectRatio: '16 / 9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        color: 'rgba(255,255,255,0.4)',
      }}>
        <svg viewBox="0 0 24 24" style={{ width: '2rem', height: '2rem' }} fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <p style={{ fontSize: '0.875rem', margin: 0 }}>
          {streetName ? `📍 ${streetName}` : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Map view coming soon</p>
      </div>
    </div>
  );
}
