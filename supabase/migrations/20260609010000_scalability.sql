-- ============================================================
-- Scalability — data retention + rate limiting infrastructure
-- ============================================================

-- Index to make purge queries and rate-limit COUNT checks fast.
-- window_start is already indexed; ingested_at is the write-time
-- used for both rate limiting (count inserts in last 60s) and purge.
CREATE INDEX IF NOT EXISTS signals_customer_ingested_idx
  ON public.signals (customer_id, ingested_at DESC);

-- Decisions already have (customer_id, decided_at DESC) index from
-- the initial migration. No new index needed for purge.

-- ----------------------------------------------------------------
-- plan_retention_days(plan) → int
-- Single source of truth for retention windows.
-- Keep in sync with pricing page tiers.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_retention_days(plan text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE plan
    WHEN 'pro'       THEN 90
    WHEN 'pro_plus'  THEN 365
    WHEN 'business'  THEN 730
    WHEN 'advanced'  THEN 1095
    ELSE 7  -- free / unknown / unrecognised
  END;
$$;

-- ----------------------------------------------------------------
-- purge_old_data()
-- Deletes signals and decisions beyond each customer's plan window.
-- Called by pg_cron daily at 03:00 UTC.
-- Runs per customer so the DELETE is always on an indexed subset.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_old_data()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  r      RECORD;
  cutoff timestamptz;
BEGIN
  FOR r IN SELECT id, plan FROM public.customers LOOP
    cutoff := NOW() - (public.plan_retention_days(r.plan)::text || ' days')::interval;

    DELETE FROM public.signals
      WHERE customer_id = r.id
        AND ingested_at < cutoff;

    DELETE FROM public.decisions
      WHERE customer_id = r.id
        AND decided_at < cutoff;
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- pg_cron schedule — daily purge at 03:00 UTC
-- ----------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('purge-old-data');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'purge-old-data',
  '0 3 * * *',
  'SELECT public.purge_old_data()'
);
