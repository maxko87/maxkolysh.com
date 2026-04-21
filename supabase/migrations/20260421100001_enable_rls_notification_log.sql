-- Enable RLS on notification_log to block anon key access.
-- No policies needed: edge functions use service_role key which bypasses RLS.
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
