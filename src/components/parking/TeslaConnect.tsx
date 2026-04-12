import { useState } from 'react';
import { startTeslaOAuth } from '../../utils/tesla';

interface TeslaConnectProps {
  onConnecting?: () => void;
}

export default function TeslaConnect({ onConnecting }: TeslaConnectProps) {
  const [hovered, setHovered] = useState(false);

  const handleConnect = () => {
    onConnecting?.();
    startTeslaOAuth();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', maxWidth: '480px', width: '100%' }}>
      {/* Copy */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          margin: 0,
        }}>
          SF Street Cleaning Alerts
        </h1>
        <p style={{
          fontSize: '1.05rem',
          color: 'rgba(255,255,255,0.55)',
          maxWidth: '360px',
          margin: '0.75rem auto 0',
          lineHeight: 1.6,
        }}>
          We check where your Tesla is parked and notify you before street cleaning.
        </p>
      </div>

      {/* Connect button */}
      <button
        onClick={handleConnect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '0.9rem 2.5rem',
          background: hovered
            ? 'linear-gradient(135deg, #ff2d33, #e82127)'
            : 'linear-gradient(135deg, #e82127, #c51d22)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '1rem',
          borderRadius: '12px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 8px 30px rgba(232, 33, 39, 0.4)'
            : '0 4px 20px rgba(232, 33, 39, 0.25)',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 33, 39, 0.5)'; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(232, 33, 39, 0.25)'; }}
      >
        Connect Tesla →
      </button>

      {/* Footer */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <p style={{
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.3)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Only reads location. No data stored. SF only.
        </p>
        <p style={{
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.25)',
          margin: 0,
        }}>
          <a
            href="https://maxkolysh.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'underline' }}
          >
            maxkolysh
          </a>
        </p>
      </div>
    </div>
  );
}
