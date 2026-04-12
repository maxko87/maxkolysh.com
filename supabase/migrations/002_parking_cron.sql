-- Enable pg_cron and pg_net extensions (must be enabled by Supabase dashboard first)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Schedule the parking check every 15 minutes
-- Uses pg_net to call the edge function with the service role key
select cron.schedule(
  'parking-check',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://vjnkdpovepqlsrdzqowd.supabase.co/functions/v1/parking-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbmtkcG92ZXBxbHNyZHpxb3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzEzMDksImV4cCI6MjA4Mjk0NzMwOX0.XvSX6nUk6Tjyx16cKrb9NvtlXExBzzKILUP8kKdnKsQ',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
