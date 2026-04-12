import type { TeslaVehicle } from '../../utils/tesla';
import { useState } from 'react';

interface VehicleSelectProps {
  vehicles: TeslaVehicle[];
  onSelect: (vehicle: TeslaVehicle) => void;
  loading?: boolean;
}

export default function VehicleSelect({ vehicles, onSelect, loading }: VehicleSelectProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid rgba(255,255,255,0.15)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.45)' }}>Loading your vehicles...</p>

      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.45)' }}>No vehicles found on your Tesla account.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '28rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>Select Your Vehicle</h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {vehicles.map((vehicle) => {
          const isHovered = hoveredId === vehicle.id;
          return (
            <button
              key={vehicle.id}
              onClick={() => onSelect(vehicle)}
              onMouseEnter={() => setHoveredId(vehicle.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                background: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <div style={{
                width: '44px', height: '44px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                🚗
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: '1rem' }}>
                  {vehicle.display_name || 'Tesla Vehicle'}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', margin: '0.15rem 0 0 0' }}>
                  {vehicle.vin}
                </p>
              </div>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: vehicle.state === 'online' ? '#4ade80' : 'rgba(255,255,255,0.2)',
                boxShadow: vehicle.state === 'online' ? '0 0 8px rgba(74, 222, 128, 0.4)' : 'none',
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
