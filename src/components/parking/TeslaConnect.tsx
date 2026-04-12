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
      {/* Tesla car silhouette with glow */}
      <div style={{ position: 'relative', width: '160px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(circle, rgba(232, 33, 39, 0.15) 0%, rgba(232, 33, 39, 0.05) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(20px)',
        }} />
        <svg
          viewBox="0 0 100 60"
          style={{ width: '120px', height: '72px', filter: 'drop-shadow(0 0 20px rgba(232, 33, 39, 0.3))' }}
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M15 45 Q15 35 25 30 L35 20 Q45 15 50 15 Q55 15 65 20 L75 30 Q85 35 85 45 L85 48 Q85 50 83 50 L75 50 Q73 50 73 48 Q73 43 70 43 Q67 43 67 48 Q67 50 65 50 L35 50 Q33 50 33 48 Q33 43 30 43 Q27 43 27 48 Q27 50 25 50 L17 50 Q15 50 15 48 Z" />
          <path d="M30 28 L38 22 Q45 18 50 18 Q55 18 62 22 L70 28 Q60 26 50 26 Q40 26 30 28 Z" opacity="0.3" />
          <circle cx="20" cy="40" r="2" fill="rgba(232, 33, 39, 0.8)" />
          <circle cx="80" cy="40" r="2" fill="rgba(232, 33, 39, 0.8)" />
        </svg>
      </div>

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
