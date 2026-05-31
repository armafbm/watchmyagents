-- Event-triggered Guardian scans (debounced ~30s) replacing the 15min cron.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Internal queue: one row per customer, server-managed only.
CREATE TABLE IF NOT EXISTS public.guardian_scan_queue (
  customer_id uuid PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  last_processed_at timestamptz,
  pending_signal_count integer NOT NULL DEFAULT 0
);

GRANT ALL ON public.guardian_scan_queue TO service_role;

ALTER TABLE public.guardian_scan_queue ENABLE ROW LEVEL SECURITY;
-- No client policies: this is internal infrastructure, only service_role/superuser touch it.

CREATE INDEX IF NOT EXISTS idx_guardian_scan_queue_due
  ON public.guardian_scan_queue (scheduled_at)
  WHERE last_processed_at IS NULL OR last_processed_at < scheduled_at;

-- Trigger: on every new signal, schedule (or extend) a debounced scan ~30s out.
CREATE OR REPLACE FUNCTION public.schedule_guardian_scan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.guardian_scan_queue (customer_id, scheduled_at, pending_signal_count)
  VALUES (NEW.customer_id, now() + interval '30 seconds', 1)
  ON CONFLICT (customer_id) DO UPDATE
    SET scheduled_at = GREATEST(EXCLUDED.scheduled_at, public.guardian_scan_queue.scheduled_at),
        pending_signal_count = public.guardian_scan_queue.pending_signal_count + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schedule_guardian_scan ON public.signals;
CREATE TRIGGER trg_schedule_guardian_scan
  AFTER INSERT ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.schedule_guardian_scan();

-- Worker: every 15s, fire due scans (one HTTP call per customer), mark them processed.
-- Uses the project's anon key in the apikey header — the guardian function accepts
-- unauthenticated POSTs (no GUARDIAN_SECRET configured) and reads customer_id from body.
DO $cron$
DECLARE
  v_anon text := 'sb_publishable_oUeaYRT70nk2TJ7FJHoMyQ_94a8lknF';
  v_url  text := 'https://kqddnrrbczrpmhnjdzmp.supabase.co/functions/v1/guardian';
BEGIN
  -- Drop legacy cron jobs if they exist (best-effort).
  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN ('guardian-scan-15min','guardian-scan-5min','guardian-scan','guardian-worker');

  PERFORM cron.schedule(
    'guardian-worker',
    '15 seconds',
    format($job$
      WITH due AS (
        SELECT customer_id, scheduled_at
        FROM public.guardian_scan_queue
        WHERE scheduled_at <= now()
          AND (last_processed_at IS NULL OR last_processed_at < scheduled_at)
        ORDER BY scheduled_at
        LIMIT 10
      ),
      invoked AS (
        SELECT d.customer_id, d.scheduled_at,
               net.http_post(
                 url := %L,
                 headers := jsonb_build_object(
                   'Content-Type','application/json',
                   'apikey', %L,
                   'Authorization','Bearer ' || %L
                 ),
                 body := jsonb_build_object('customer_id', d.customer_id, 'trigger', 'event')
               ) AS request_id
        FROM due d
      )
      UPDATE public.guardian_scan_queue q
      SET last_processed_at = now(),
          pending_signal_count = 0
      FROM invoked i
      WHERE q.customer_id = i.customer_id
        AND q.scheduled_at = i.scheduled_at;
    $job$, v_url, v_anon, v_anon)
  );

  -- Safety net: keep a slow hourly fleet-wide scan for the first week.
  PERFORM cron.schedule(
    'guardian-safety-net-hourly',
    '0 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'apikey', %L,
          'Authorization','Bearer ' || %L
        ),
        body := jsonb_build_object('trigger','safety_net')
      );
    $job$, v_url, v_anon, v_anon)
  );
END
$cron$;
