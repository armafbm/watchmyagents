ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS parent_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS composition_pattern text NOT NULL DEFAULT 'solo';

DO $$ BEGIN
  ALTER TABLE public.agents
    ADD CONSTRAINT agents_composition_pattern_check
    CHECK (composition_pattern IN ('solo','hierarchy','graph','peer'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_agents_parent ON public.agents (parent_agent_id);

UPDATE public.agents
SET composition_pattern = 'solo'
WHERE composition_pattern IS NULL OR composition_pattern = '';

ALTER TABLE public.policies
  ALTER COLUMN surface_type SET DEFAULT 'agent';

ALTER TABLE public.policies
  DROP CONSTRAINT IF EXISTS policies_surface_type_check;

ALTER TABLE public.policies
  ADD CONSTRAINT policies_surface_type_check
  CHECK (surface_type IS NULL OR surface_type IN ('agent','subtree','type','fleet'));