import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

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

  // Load existing prefs from DB
  useEffect(() => {
    if (!teslaUserId) return;
    
    (async () => {
      try {
        const { data } = await supabase
          .from('tesla_users')
          .select('notification_prefs')
          .eq('tesla_user_id', teslaUserId)
          .single();
        
        if (data?.notification_prefs) {
          setPrefs(data.notification_prefs);
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
      const { error: dbError } = await supabase
        .from('tesla_users')
        .update({ notification_prefs: prefs })
        .eq('tesla_user_id', teslaUserId);

      if (dbError) throw dbError;
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
