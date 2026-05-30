ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'anthropic-managed';

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS native_agent_id text;

UPDATE public.agents
SET native_agent_id = anthropic_agent_id
WHERE native_agent_id IS NULL;

ALTER TABLE public.agents
  ALTER COLUMN native_agent_id SET NOT NULL;

DROP INDEX IF EXISTS public.idx_agents_customer_anthropic_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_customer_provider_native
  ON public.agents (customer_id, provider, native_agent_id);

ALTER TABLE public.agents
  ALTER COLUMN anthropic_agent_id DROP NOT NULL;