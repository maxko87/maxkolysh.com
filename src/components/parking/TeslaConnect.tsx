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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem', maxWidth: '560px', width: '100%' }}>
      <style>{`
        @media (max-width: 480px) {
          .parking-steps-grid {
            flex-direction: column !important;
          }
          .parking-steps-grid > div {
            width: 100% !important;
          }
        }
      `}</style>
      {/* Tesla car silhouette with glow */}
      <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(circle, rgba(232, 33, 39, 0.15) 0%, rgba(232, 33, 39, 0.05) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(20px)',
        }} />
        <svg
          viewBox="0 0 100 60"
          style={{ width: '160px', height: '96px', filter: 'drop-shadow(0 0 20px rgba(232, 33, 39, 0.3))' }}
          fill="rgba(255,255,255,0.85)"
        >
          <path d="M15 45 Q15 35 25 30 L35 20 Q45 15 50 15 Q55 15 65 20 L75 30 Q85 35 85 45 L85 48 Q85 50 83 50 L75 50 Q73 50 73 48 Q73 43 70 43 Q67 43 67 48 Q67 50 65 50 L35 50 Q33 50 33 48 Q33 43 30 43 Q27 43 27 48 Q27 50 25 50 L17 50 Q15 50 15 48 Z" />
          <path d="M30 28 L38 22 Q45 18 50 18 Q55 18 62 22 L70 28 Q60 26 50 26 Q40 26 30 28 Z" opacity="0.3" />
          {/* Headlights */}
          <circle cx="20" cy="40" r="2" fill="rgba(232, 33, 39, 0.8)" />
          <circle cx="80" cy="40" r="2" fill="rgba(232, 33, 39, 0.8)" />
        </svg>
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          margin: 0,
        }}>
          Don't Get Towed
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: 'rgba(255,255,255,0.6)',
          maxWidth: '420px',
          margin: '0.75rem auto 0',
          lineHeight: 1.6,
        }}>
          Connect your Tesla. We'll check SF street cleaning where you're parked.
        </p>
      </div>

      {/* How it works — step cards */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: '1rem',
        width: '100%',
        justifyContent: 'center',
      }} className="parking-steps-grid">
        {[
          { step: '1', label: 'Connect Tesla', icon: '🔗' },
          { step: '2', label: 'Read GPS', icon: '📍' },
          { step: '3', label: 'See schedule', icon: '🧹' },
        ].map(({ step, label, icon }) => (
          <div key={step} style={{
            flex: '1 1 120px',
            minWidth: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem 0.75rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(232, 33, 39, 0.2), rgba(232, 33, 39, 0.05))',
              border: '1px solid rgba(232, 33, 39, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#e82127',
            }}>
              {step}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 1.4 }}>
              {icon} {label}
            </span>
          </div>
        ))}
      </div>

      {/* Connect button */}
      <button
        onClick={handleConnect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '1rem 3rem',
          background: hovered
            ? 'linear-gradient(135deg, #ff2d33, #e82127)'
            : 'linear-gradient(135deg, #e82127, #c51d22)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '1.125rem',
          borderRadius: '14px',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 8px 30px rgba(232, 33, 39, 0.4), 0 0 0 1px rgba(232, 33, 39, 0.2)'
            : '0 4px 20px rgba(232, 33, 39, 0.25)',
          letterSpacing: '0.01em',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 33, 39, 0.5), 0 4px 20px rgba(232, 33, 39, 0.25)'; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(232, 33, 39, 0.25)'; }}
      >
        Connect Tesla →
      </button>

      <p style={{
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.4)',
        maxWidth: '380px',
        textAlign: 'center',
        lineHeight: 1.5,
      }}>
        We only read your car's location. No data is stored. Works exclusively in San Francisco.
      </p>
    </div>
  );
}
