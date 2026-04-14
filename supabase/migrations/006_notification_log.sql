create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references tesla_users(id),
  type text not null,
  reminder_key text,
  email text not null,
  subject text not null,
  street text,
  location_lat double precision,
  location_lng double precision,
  cleaning_date timestamptz,
  created_at timestamptz default now()
);

create index idx_notification_log_user_created on notification_log (user_id, created_at);
