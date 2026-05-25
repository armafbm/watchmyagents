CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('guardian-15min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'guardian-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kqddnrrbczrpmhnjdzmp.supabase.co/functions/v1/guardian',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'apikey', 'sb_publishable_oUeaYRT70nk2TJ7FJHoMyQ_94a8lknF'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);