import { useState, useEffect } from 'react';

interface NotificationPrefsProps {
  email: string | null;
  teslaUserId: string | null;
}

const PREF_OPTIONS = [
  { key: '1h', label: '1 hour before' },
  { key: '3h', label: '3 hours before' },
  { key: '1d', label: '1 day before' },
  { key: '2d', label: '2 days before' },
] as const;

export default function NotificationPrefs({ email, teslaUserId }: NotificationPrefsProps) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    '1h': true,
    '3h': false,
    '1d': false,
    '2d': false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUPABASE_URL = 'https://vjnkdpovepqlsrdzqowd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbmtkcG92ZXBxbHNyZHpxb3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzEzMDksImV4cCI6MjA4Mjk0NzMwOX0.XvSX6nUk6Tjyx16cKrb9NvtlXExBzzKILUP8kKdnKsQ';

  // Load existing prefs from DB via edge function
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
            method: 'POST',
            token: '',
            body: { tesla_user_id: teslaUserId },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.notification_prefs) {
            setPrefs(data.notification_prefs);
          }
        }
      } catch {
        // Use defaults
      }
    })();
  }, [teslaUserId]);

  async function handleSave() {
    if (!teslaUserId) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/tesla-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          endpoint: '_internal/save-prefs',
          method: 'POST',
          token: '',
          body: { tesla_user_id: teslaUserId, notification_prefs: prefs },
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!email) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '32rem',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '1.5rem',
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: '#fff',
          margin: '0 0 0.25rem 0',
        }}>
          📧 Email Reminders
        </h3>
        <p style={{
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.35)',
          margin: 0,
        }}>
          We'll email <span style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</span> before street cleaning
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {PREF_OPTIONS.map(({ key, label }) => (
          <label
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '10px',
              cursor: 'pointer',
              background: prefs[key] ? 'rgba(232, 33, 39, 0.08)' : 'transparent',
              border: `1px solid ${prefs[key] ? 'rgba(232, 33, 39, 0.2)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={prefs[key] || false}
              onChange={e => {
                setPrefs(p => ({ ...p, [key]: e.target.checked }));
                setSaved(false);
              }}
              style={{
                width: 18,
                height: 18,
                accentColor: '#e82127',
                cursor: 'pointer',
              }}
            />
            <span style={{
              fontSize: '0.9rem',
              color: prefs[key] ? '#fff' : 'rgba(255,255,255,0.5)',
            }}>
              {label}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          marginTop: '1rem',
          padding: '0.7rem',
          background: saved
            ? 'rgba(34, 197, 94, 0.15)'
            : 'rgba(232, 33, 39, 0.12)',
          color: saved ? '#22c55e' : '#e82127',
          border: `1px solid ${saved ? 'rgba(34, 197, 94, 0.3)' : 'rgba(232, 33, 39, 0.25)'}`,
          borderRadius: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: saving ? 'wait' : 'pointer',
          transition: 'all 0.2s',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Preferences'}
      </button>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
}
