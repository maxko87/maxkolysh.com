import { useState, useEffect, useCallback } from 'react';

interface NotificationPrefsProps {
  email: string | null;
  teslaUserId: string | null;
}

const PREF_OPTIONS = [
  { key: '1h', label: '1 hour' },
  { key: '3h', label: '3 hours' },
  { key: '1d', label: '1 day' },
  { key: '2d', label: '2 days' },
] as const;

const SUPABASE_URL = 'https://vjnkdpovepqlsrdzqowd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbmtkcG92ZXBxbHNyZHpxb3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzEzMDksImV4cCI6MjA4Mjk0NzMwOX0.XvSX6nUk6Tjyx16cKrb9NvtlXExBzzKILUP8kKdnKsQ';

function toE164(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return input;
}

export default function NotificationPrefs({ email, teslaUserId }: NotificationPrefsProps) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    park: true,
    '1h': true,
    '3h': false,
    '1d': false,
    '2d': false,
    sms: false,
  });
  const [phoneDraft, setPhoneDraft] = useState('');

  // Load existing prefs
  useEffect(() => {
    if (!teslaUserId) return;
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/tesla-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            endpoint: '_internal/get-prefs',
            body: { tesla_user_id: teslaUserId },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.notification_prefs) setPrefs({ sms: false, ...data.notification_prefs });
          if (data.phone) {
            setPhoneDraft(data.phone);
          }
        }
      } catch { /* use defaults */ }
    })();
  }, [teslaUserId]);

  const savePrefs = useCallback(async (newPrefs: Record<string, boolean>, newPhone?: string | null) => {
    if (!teslaUserId) return;
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/tesla-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          endpoint: '_internal/save-prefs',
          body: {
            tesla_user_id: teslaUserId,
            notification_prefs: newPrefs,
            ...(newPhone !== undefined ? { phone: newPhone } : {}),
          },
        }),
      });
    } catch {
      // silent fail
    }
  }, [teslaUserId]);

  function toggle(key: string) {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    savePrefs(newPrefs);
  }

  function handlePhoneBlur() {
    const trimmed = phoneDraft.trim();
    const formatted = trimmed ? toE164(trimmed) : '';
    setPhoneDraft(formatted);
    savePrefs(prefs, formatted || null);
  }

  if (!email) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '32rem',
      background: '#141414',
      border: '1px solid #2C2C2E',
      borderRadius: '16px',
      padding: '1.25rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        marginBottom: '1rem',
      }}>
        <span style={{ fontSize: '1rem' }}>📧</span>
        <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
          Email Notifications
        </span>
      </div>

      {/* Just Parked toggle */}
      <button
        onClick={() => toggle('park')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: '#1C1C1E',
          border: '1px solid #2C2C2E',
          borderRadius: '12px',
          padding: '0.8rem 0.85rem',
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
      >
        <span style={{ fontSize: '0.95rem', color: '#fff' }}>
          Email me every time I park
        </span>
        <ToggleSwitch on={prefs.park !== false} />
      </button>

      {/* Cleaning Reminders label */}
      <div style={{
        fontSize: '0.8rem',
        color: '#8A8A8E',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        Cleaning Reminders
      </div>

      {/* 2x2 grid of reminder toggles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.65rem',
      }}>
        {PREF_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1C1C1E',
              border: '1px solid #2C2C2E',
              borderRadius: '12px',
              padding: '0.8rem 0.85rem',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '0.95rem', color: '#fff' }}>
              {label}
            </span>
            <ToggleSwitch on={prefs[key] || false} />
          </button>
        ))}
      </div>

      {/* Footer */}
      <p style={{
        fontSize: '0.8rem',
        color: '#8A8A8E',
        margin: '1rem 0 0 0',
      }}>
        Sending to {email}
      </p>

      {/* SMS Section */}
      <div style={{ borderTop: '1px solid #2C2C2E', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          marginBottom: '1rem',
        }}>
          <span style={{ fontSize: '1rem' }}>📱</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
            SMS Notifications
          </span>
        </div>

        <input
          type="tel"
          placeholder="Phone number"
          value={phoneDraft}
          onChange={e => setPhoneDraft(e.target.value)}
          onBlur={handlePhoneBlur}
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            background: '#1C1C1E',
            border: '1px solid #2C2C2E',
            borderRadius: '12px',
            padding: '0.8rem 0.85rem',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none',
            marginBottom: '0.75rem',
          }}
        />

        <button
          onClick={() => toggle('sms')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: '#1C1C1E',
            border: '1px solid #2C2C2E',
            borderRadius: '12px',
            padding: '0.8rem 0.85rem',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '0.95rem', color: '#fff' }}>
            Text me notifications
          </span>
          <ToggleSwitch on={prefs.sms === true} />
        </button>
      </div>
    </div>
  );
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <div style={{
      width: '44px',
      height: '26px',
      borderRadius: '13px',
      background: on ? '#34C759' : '#3A3A3C',
      position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        width: '22px',
        height: '22px',
        borderRadius: '11px',
        background: '#fff',
        position: 'absolute',
        top: '2px',
        left: on ? '20px' : '2px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}
