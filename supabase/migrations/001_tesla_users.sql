create table if not exists public.tesla_users (
  id uuid primary key default gen_random_uuid(),
  tesla_user_id text unique not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  last_checked_at timestamptz,
  last_shift_state text,
  last_latitude double precision,
  last_longitude double precision,
  last_notification_at timestamptz,
  notify_telegram_chat_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.tesla_users enable row level security;

-- No public access — only service_role can read/write
-- (Edge functions use SUPABASE_SERVICE_ROLE_KEY)
