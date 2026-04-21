-- Drop website_snapshots and related objects (if they exist)
-- The table may not exist if it was only created via setup.sql and not via migrations

DROP FUNCTION IF EXISTS cleanup_old_snapshots() CASCADE;
DROP INDEX IF EXISTS idx_website_snapshots_url;
DROP INDEX IF EXISTS idx_website_snapshots_created_at;
DROP TABLE IF EXISTS website_snapshots;
