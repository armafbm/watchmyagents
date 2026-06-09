-- ============================================================
-- Named fleets (Legions) — fleet deployment feature
-- ============================================================
-- A Legion is a named group of agents. Policies with
-- surface_type='fleet' AND surface_ref=legion_id apply only
-- to agents in that legion. surface_ref=NULL still means
-- "all agents of this customer" (whole-fleet catch-all).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.legions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  color       text NOT NULL DEFAULT 'primary',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, name)
);
CREATE INDEX IF NOT EXISTS legions_customer_idx ON public.legions (customer_id);

ALTER TABLE public.legions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS legions_all_self ON public.legions;
CREATE POLICY legions_all_self ON public.legions FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- ----------------------------------------------------------------
-- agents.legion_id — which fleet this agent belongs to (nullable)
-- ON DELETE SET NULL: deleting a fleet un-assigns its agents.
-- ----------------------------------------------------------------
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS legion_id uuid REFERENCES public.legions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS agents_legion_idx ON public.agents (legion_id);

-- Publish legions to realtime so the UI updates on fleet changes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'legions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.legions;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime setup skipped: %', SQLERRM;
END $$;
