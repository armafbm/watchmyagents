-- ============================================================
-- Fleets & Teams — aligned with SDK v1.2.x hierarchy
-- Account → Fleet (1 WMA API key) → Team → Agent
-- "Legions" is the UI dashboard name, not a table.
-- ============================================================

-- Drop old legions table (was test data only, no production rows)
DROP TABLE IF EXISTS public.legions CASCADE;

-- Remove legion_id from agents (replaced by fleet_id + agent_team_membership)
ALTER TABLE public.agents DROP COLUMN IF EXISTS legion_id;

-- ----------------------------------------------------------------
-- fleets: one fleet per WMA API key (wma_xxx)
-- Created when customer registers a new WMA API key + runtime.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fleets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  api_key_id  uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  name        text NOT NULL,
  description text,
  runtime     text NOT NULL DEFAULT 'generic'
              CHECK (runtime IN ('anthropic', 'openai', 'claude-code', 'agentcore', 'generic')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_fleet_name_per_customer UNIQUE (customer_id, name)
);

CREATE INDEX IF NOT EXISTS idx_fleets_customer ON public.fleets (customer_id);
CREATE INDEX IF NOT EXISTS idx_fleets_api_key  ON public.fleets (api_key_id);

ALTER TABLE public.fleets ENABLE ROW LEVEL SECURITY;
CREATE POLICY fleets_all_self ON public.fleets FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleets TO authenticated;
GRANT ALL ON public.fleets TO service_role;

-- ----------------------------------------------------------------
-- teams: logical groups of agents within a fleet
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id           uuid NOT NULL REFERENCES public.fleets(id) ON DELETE CASCADE,
  customer_id        uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name               text NOT NULL,
  description        text,
  criticality        text NOT NULL DEFAULT 'medium'
                     CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  owner_user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags               text[] NOT NULL DEFAULT '{}',
  notes              text,
  auto_detected_from text NOT NULL DEFAULT 'manual'
                     CHECK (auto_detected_from IN ('handoff', 'runId', 'env', 'manual')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_team_name_per_fleet UNIQUE (fleet_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_fleet    ON public.teams (fleet_id);
CREATE INDEX IF NOT EXISTS idx_teams_customer ON public.teams (customer_id);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_all_self ON public.teams FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;

-- ----------------------------------------------------------------
-- agent_team_membership: many-to-many agent ↔ team
-- Usual case is 1-to-1 but the model supports multi-team tagging.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_team_membership (
  agent_id    uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  team_id     uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_by text NOT NULL DEFAULT 'manual'
              CHECK (assigned_by IN ('auto', 'manual')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_atm_team  ON public.agent_team_membership (team_id);
CREATE INDEX IF NOT EXISTS idx_atm_agent ON public.agent_team_membership (agent_id);

ALTER TABLE public.agent_team_membership ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_team_membership_self ON public.agent_team_membership FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_id AND a.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_id AND a.customer_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_team_membership TO authenticated;
GRANT ALL ON public.agent_team_membership TO service_role;

-- ----------------------------------------------------------------
-- agents: add fleet_id
-- ----------------------------------------------------------------
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS fleet_id uuid REFERENCES public.fleets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_fleet ON public.agents (fleet_id);

-- ----------------------------------------------------------------
-- api_keys: add runtime column (which SDK adapter registered this key)
-- ----------------------------------------------------------------
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS runtime text NOT NULL DEFAULT 'generic'
  CHECK (runtime IN ('anthropic', 'openai', 'claude-code', 'agentcore', 'generic'));

-- ----------------------------------------------------------------
-- policies + suggestions: allow surface_type='team'
-- Drop old constraint, recreate with 'team' added.
-- ----------------------------------------------------------------
ALTER TABLE public.policies
  DROP CONSTRAINT IF EXISTS policies_surface_type_chk,
  DROP CONSTRAINT IF EXISTS policies_surface_type_check;

ALTER TABLE public.policies
  ADD CONSTRAINT policies_surface_type_chk
  CHECK (surface_type IS NULL OR surface_type IN ('agent', 'subtree', 'type', 'fleet', 'team'));

ALTER TABLE public.suggestions
  DROP CONSTRAINT IF EXISTS suggestions_surface_type_chk,
  DROP CONSTRAINT IF EXISTS suggestions_surface_type_check;

ALTER TABLE public.suggestions
  ADD CONSTRAINT suggestions_surface_type_chk
  CHECK (surface_type IS NULL OR surface_type IN ('agent', 'type', 'fleet', 'team'));

-- ----------------------------------------------------------------
-- Realtime for new tables
-- ----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'fleets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fleets;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'teams') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime setup skipped: %', SQLERRM;
END $$;
