-- Add last_reminders_sent column to track which reminder intervals have been sent
ALTER TABLE tesla_users ADD COLUMN IF NOT EXISTS last_reminders_sent jsonb DEFAULT '{}'::jsonb;

-- Schedule the parking-remind cron every 5 minutes
select cron.schedule(
  'parking-remind',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://vjnkdpovepqlsrdzqowd.supabase.co/functions/v1/parking-remind',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbmtkcG92ZXBxbHNyZHpxb3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzEzMDksImV4cCI6MjA4Mjk0NzMwOX0.XvSX6nUk6Tjyx16cKrb9NvtlXExBzzKILUP8kKdnKsQ',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
