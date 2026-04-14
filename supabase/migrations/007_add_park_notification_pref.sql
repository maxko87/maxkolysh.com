-- Add park: true to all existing users' notification_prefs
UPDATE public.tesla_users
SET notification_prefs = COALESCE(notification_prefs, '{}'::jsonb) || '{"park": true}'::jsonb
WHERE notification_prefs IS NULL OR NOT (notification_prefs ? 'park');

-- Update column default to include park: true
ALTER TABLE public.tesla_users
  ALTER COLUMN notification_prefs SET DEFAULT '{"park": true, "1h": true, "3h": false, "1d": false, "2d": false}'::jsonb;
