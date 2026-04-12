CREATE TABLE IF NOT EXISTS tesla_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tesla_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  vehicle_id TEXT,
  notification_prefs JSONB DEFAULT '{"1h": true, "3h": false, "1d": false, "2d": false}',
  last_location JSONB,
  last_notified_at TIMESTAMPTZ,
  last_cleaning_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tesla_users ENABLE ROW LEVEL SECURITY;
