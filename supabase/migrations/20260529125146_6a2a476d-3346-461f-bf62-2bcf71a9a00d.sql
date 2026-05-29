
-- 1. Agents: typology columns
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS agent_type text,
  ADD COLUMN IF NOT EXISTS agent_type_confidence numeric,
  ADD COLUMN IF NOT EXISTS agent_type_stage text,
  ADD COLUMN IF NOT EXISTS agent_type_updated_at timestamptz;

-- 2. Policies: deploy surface
ALTER TABLE public.policies
  ADD COLUMN IF NOT EXISTS surface_type text,
  ADD COLUMN IF NOT EXISTS surface_ref text;

DO $$ BEGIN
  ALTER TABLE public.policies
    ADD CONSTRAINT policies_surface_type_chk
    CHECK (surface_type IN ('agent','type','fleet'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill existing rows
UPDATE public.policies
SET surface_type = CASE WHEN agent_id IS NULL THEN 'fleet' ELSE 'agent' END
WHERE surface_type IS NULL;

CREATE INDEX IF NOT EXISTS policies_surface_idx
  ON public.policies (customer_id, surface_type, surface_ref);

-- 3. Shield templates
CREATE TABLE IF NOT EXISTS public.shield_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype text UNIQUE NOT NULL,
  threat_profile jsonb,
  baseline_policies jsonb,
  version text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shield_templates TO authenticated;
GRANT ALL ON public.shield_templates TO service_role;

ALTER TABLE public.shield_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY shield_templates_read ON public.shield_templates
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Seed global-baseline (5 mandatory fail_closed floors)
INSERT INTO public.shield_templates (archetype, version, threat_profile, baseline_policies)
VALUES (
  'global-baseline',
  '1.0.0',
  '{"description":"Mandatory floors. Always apply to every agent regardless of type."}'::jsonb,
  '[
    {"rule_id":"gb-revoked-agent","name":"Block revoked agents","match":{"agent_status":"revoked"},"action":"deny","message":"Agent is revoked.","priority":1,"mandatory":true},
    {"rule_id":"gb-ioc-malicious","name":"Block known-malicious IoC hashes","match":{"ioc_hash_flag":"malicious"},"action":"deny","message":"Blocked by IoC threat intel.","priority":2,"mandatory":true},
    {"rule_id":"gb-prompt-injection","name":"Deny high prompt-injection score","match":{"prompt_injection_score":{"gte":0.85}},"action":"deny","message":"Prompt injection detected.","priority":3,"mandatory":true},
    {"rule_id":"gb-exfil-volume","name":"Deny massive outbound payload","match":{"outbound_bytes":{"gte":10485760}},"action":"deny","message":"Outbound payload exceeds safety floor.","priority":4,"mandatory":true},
    {"rule_id":"gb-loop-runaway","name":"Interrupt runaway loops","match":{"identical_sequence_per_min":{"gte":30}},"action":"interrupt","message":"Runaway loop detected.","priority":5,"mandatory":true}
  ]'::jsonb
)
ON CONFLICT (archetype) DO UPDATE SET
  threat_profile = EXCLUDED.threat_profile,
  baseline_policies = EXCLUDED.baseline_policies,
  version = EXCLUDED.version,
  updated_at = now();

-- 5. Seed placeholder rows for the 10 archetypes (user fills baseline_policies later)
INSERT INTO public.shield_templates (archetype, version, threat_profile, baseline_policies)
SELECT a, '0.1.0', '{}'::jsonb, '[]'::jsonb
FROM unnest(ARRAY[
  'coding','devops_infra','data_rag','customer_facing','browser_web',
  'orchestrator','workflow_backoffice','personal_assistant',
  'transactional_financial','generic'
]) AS a
ON CONFLICT (archetype) DO NOTHING;
