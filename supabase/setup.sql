-- Table for storing website snapshots
CREATE TABLE IF NOT EXISTS website_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  html_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by URL
CREATE INDEX IF NOT EXISTS idx_website_snapshots_url ON website_snapshots(url);
CREATE INDEX IF NOT EXISTS idx_website_snapshots_created_at ON website_snapshots(created_at DESC);

-- Keep only last 100 snapshots per URL to avoid bloat
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM website_snapshots
  WHERE url = NEW.url
  AND id NOT IN (
    SELECT id FROM website_snapshots
    WHERE url = NEW.url
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_snapshots_trigger ON website_snapshots;
CREATE TRIGGER cleanup_snapshots_trigger
AFTER INSERT ON website_snapshots
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_snapshots();
