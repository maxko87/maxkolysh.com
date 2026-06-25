-- Right-size Tesla Fleet API polling + add usage metering.
--
-- Background: the prior "sleep-aware" change set the parking-check cron to
-- */2 (720 runs/day/user) on the WRONG assumption that GET /api/1/vehicles is
-- free. It is not — Tesla bills every <500 response (~$0.002/list call). At */2
-- that's ~$43/mo/car for the list call alone, which blew the $10/mo account
-- credit and tripped Tesla's "billing limit exceeded -> apps disabled" guard.
--
-- Street cleaning is scheduled hours-to-days out, so we don't need fast polling.
-- */10 detects a new parking spot within ~10 min, which is ample lead time, and
-- cuts list-call volume ~7x vs */2.
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'parking-check'),
  schedule := '*/10 * * * *'
);

-- Usage metering: one row per parking-check invocation, so we can see REAL
-- Fleet API spend instead of estimating it. list_calls = billed GET
-- /api/1/vehicles calls; data_reads = billed vehicle_data reads ($0.002 each);
-- est_cost_usd = a rough dollar estimate using published per-call prices.
CREATE TABLE IF NOT EXISTS tesla_api_usage (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ran_at       timestamptz NOT NULL DEFAULT now(),
  users        int NOT NULL DEFAULT 0,
  list_calls   int NOT NULL DEFAULT 0,
  data_reads   int NOT NULL DEFAULT 0,
  est_cost_usd numeric(10,5) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS tesla_api_usage_ran_at_idx ON tesla_api_usage (ran_at DESC);
