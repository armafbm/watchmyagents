-- Correctif : repointe les cron jobs guardian vers le nouveau projet Supabase.
-- Remplace l'ancien ref kqddnrrbczrpmhnjdzmp par fgcmjkgxrkprsllivmli.

DO $cron$
DECLARE
  v_anon text := 'sb_publishable_IQoeUDt8sO8cFVoBshW9nw_1a81f-5V';
  v_url  text := 'https://fgcmjkgxrkprsllivmli.supabase.co/functions/v1/guardian';
BEGIN
  -- Supprime tous les anciens cron jobs guardian
  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN (
    'guardian-15min',
    'guardian-scan-15min',
    'guardian-scan-5min',
    'guardian-scan',
    'guardian-worker',
    'guardian-safety-net-hourly'
  );

  -- Recrée guardian-worker (toutes les 15s) sur le nouveau projet
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

  -- Recrée le safety-net horaire sur le nouveau projet
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
