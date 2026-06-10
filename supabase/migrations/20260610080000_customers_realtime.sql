-- Enable Realtime on customers so profile updates propagate instantly.
-- Without this, postgres_changes subscriptions on customers never fire.
ALTER TABLE public.customers REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'customers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
  END IF;
END;
$$;
