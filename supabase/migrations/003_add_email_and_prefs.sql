-- Add email and notification preferences for Resend email alerts
ALTER TABLE public.tesla_users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.tesla_users ADD COLUMN IF NOT EXISTS vehicle_id text;
ALTER TABLE public.tesla_users ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{"1h": true, "3h": false, "1d": false, "2d": false}';
