-- Sleep-aware polling: drastically cut Tesla Fleet API "device data" spend.
--
-- Strategy: the vehicle LIST endpoint (GET /api/1/vehicles) is free and reads
-- Tesla's cloud cache (state: online/asleep/offline) without waking the car.
-- The billed call is vehicle_data ($0.002 each). A car only changes parking
-- spot by waking -> driving -> parking, so we only spend a vehicle_data read
-- when a car is online AND (it just woke OR we haven't yet confirmed it's
-- parked this session). Once shift_state == 'P' we stop paying until it sleeps
-- and wakes again. Sentry/charging cars (online all day while parked) cost ~1
-- read per arrival instead of one per poll.

-- Last state seen from the LIST endpoint, to detect an asleep/offline -> online
-- "wake" transition (the trigger for an immediate, free-to-detect paid read).
ALTER TABLE tesla_users ADD COLUMN IF NOT EXISTS last_vehicle_state text;

-- True once we've confirmed the car is parked (shift_state == 'P') for the
-- current online session. Suppresses further paid reads until the car sleeps
-- (which resets this to false). Keeps sentry-mode cars cheap.
ALTER TABLE tesla_users ADD COLUMN IF NOT EXISTS location_captured boolean NOT NULL DEFAULT false;

-- When we last spent a paid vehicle_data read, to throttle reads while the car
-- is online but still driving (so a long drive doesn't read every 2 minutes).
ALTER TABLE tesla_users ADD COLUMN IF NOT EXISTS last_data_read_at timestamptz;

-- Poll state more often now that the frequent check is the FREE list endpoint.
-- Paid reads stay gated by the logic above, so cadence no longer drives cost.
-- This catches a quick cross-street move within ~2 min (the move wakes the car;
-- the next free state check sees online and fires one immediate paid read).
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'parking-check'),
  schedule := '*/2 * * * *'
);
