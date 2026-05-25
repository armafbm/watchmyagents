BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.customers (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL UNIQUE,
  display_name    text,
  plan            text NOT NULL DEFAULT 'free',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.customers (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.agents (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  anthropic_agent_id    text NOT NULL,
  display_name          text NOT NULL,
  status                text NOT NULL DEFAULT 'active',
  last_seen_at          timestamptz,
  shield_mode_detected  text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, anthropic_agent_id)
);
CREATE INDEX IF NOT EXISTS agents_customer_idx ON public.agents (customer_id);
CREATE INDEX IF NOT EXISTS agents_last_seen_idx ON public.agents (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.signals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id        uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  window_start    timestamptz NOT NULL,
  window_end      timestamptz NOT NULL,
  payload         jsonb NOT NULL,
  ingested_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signals_customer_window_idx
  ON public.signals (customer_id, window_start DESC);
CREATE INDEX IF NOT EXISTS signals_agent_window_idx
  ON public.signals (agent_id, window_start DESC);

CREATE TABLE IF NOT EXISTS public.policies (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id            uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id               uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  rule_id                text NOT NULL,
  name                   text NOT NULL,
  rationale              text,
  match                  jsonb NOT NULL,
  action                 text NOT NULL CHECK (action IN ('allow','deny','interrupt')),
  message                text,
  priority               int NOT NULL DEFAULT 100,
  enabled                bool NOT NULL DEFAULT true,
  suggested_by_guardian  bool NOT NULL DEFAULT false,
  suggestion_id          uuid,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, rule_id)
);
CREATE INDEX IF NOT EXISTS policies_customer_idx ON public.policies (customer_id);
CREATE INDEX IF NOT EXISTS policies_agent_enabled_idx ON public.policies (agent_id, enabled);

CREATE TABLE IF NOT EXISTS public.decisions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id          uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  policy_id         uuid REFERENCES public.policies(id) ON DELETE SET NULL,
  session_hash      text,
  event_id_hash     text,
  decision          text NOT NULL CHECK (decision IN ('allow','deny','interrupt')),
  input_hash        text,
  action_type       text,
  tool_name         text,
  message           text,
  decided_at        timestamptz NOT NULL DEFAULT now(),
  decided_in_ms     int
);
CREATE INDEX IF NOT EXISTS decisions_customer_decided_idx ON public.decisions (customer_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS decisions_agent_decided_idx ON public.decisions (agent_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS decisions_decision_idx ON public.decisions (customer_id, decision, decided_at DESC);

CREATE TABLE IF NOT EXISTS public.suggestions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id            uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  title               text NOT NULL,
  rationale           text NOT NULL,
  proposed_match      jsonb NOT NULL,
  proposed_action     text NOT NULL CHECK (proposed_action IN ('allow','deny','interrupt')),
  proposed_message    text,
  status              text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','accepted','rejected','superseded')),
  applied_policy_id   uuid REFERENCES public.policies(id) ON DELETE SET NULL,
  generated_at        timestamptz NOT NULL DEFAULT now(),
  resolved_at         timestamptz,
  resolved_by         uuid REFERENCES public.customers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS suggestions_customer_status_idx
  ON public.suggestions (customer_id, status, generated_at DESC);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label         text NOT NULL,
  prefix        text NOT NULL,
  hash          text NOT NULL UNIQUE,
  scopes        text[] NOT NULL DEFAULT ARRAY['watch:write','shield:read','decisions:write'],
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_keys_customer_idx ON public.api_keys (customer_id);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customers_select_self ON public.customers;
CREATE POLICY customers_select_self ON public.customers FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS customers_update_self ON public.customers;
CREATE POLICY customers_update_self ON public.customers FOR UPDATE USING (id = auth.uid());

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agents_all_self ON public.agents;
CREATE POLICY agents_all_self ON public.agents FOR ALL
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS signals_all_self ON public.signals;
CREATE POLICY signals_all_self ON public.signals FOR ALL
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS policies_all_self ON public.policies;
CREATE POLICY policies_all_self ON public.policies FOR ALL
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS decisions_all_self ON public.decisions;
CREATE POLICY decisions_all_self ON public.decisions FOR ALL
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS suggestions_all_self ON public.suggestions;
CREATE POLICY suggestions_all_self ON public.suggestions FOR ALL
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS api_keys_all_self ON public.api_keys;
CREATE POLICY api_keys_all_self ON public.api_keys FOR ALL
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

CREATE OR REPLACE VIEW public.dashboard_today_v AS
SELECT
  c.id AS customer_id,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') AS agents_active,
  COALESCE(SUM((s.payload->>'tokens_total')::bigint)
           FILTER (WHERE s.window_start > NOW() - INTERVAL '24 hours'), 0) AS tokens_24h,
  COUNT(d.id) FILTER (WHERE d.decided_at > NOW() - INTERVAL '24 hours') AS actions_24h,
  COUNT(d.id) FILTER (WHERE d.decided_at > NOW() - INTERVAL '24 hours'
                            AND d.decision IN ('deny','interrupt')) AS blocked_24h,
  (SELECT COUNT(*) FROM public.suggestions sg
    WHERE sg.customer_id = c.id AND sg.status = 'pending') AS suggestions_pending
FROM public.customers c
LEFT JOIN public.agents a    ON a.customer_id = c.id
LEFT JOIN public.signals s   ON s.customer_id = c.id
LEFT JOIN public.decisions d ON d.customer_id = c.id
GROUP BY c.id;

CREATE OR REPLACE VIEW public.loop_overview_v AS
SELECT
  a.id AS agent_id,
  a.customer_id,
  a.display_name,
  COALESCE(SUM(jsonb_array_length(s.payload->'ioc_hashes'))
           FILTER (WHERE s.window_start > NOW() - INTERVAL '7 days'), 0) AS signals_7d,
  (SELECT COUNT(*) FROM public.suggestions sg
    WHERE sg.agent_id = a.id AND sg.generated_at > NOW() - INTERVAL '7 days') AS suggestions_7d,
  (SELECT COUNT(*) FROM public.suggestions sg
    WHERE sg.agent_id = a.id AND sg.status = 'accepted'
      AND sg.resolved_at > NOW() - INTERVAL '7 days') AS suggestions_accepted_7d,
  (SELECT COUNT(*) FROM public.decisions d
    WHERE d.agent_id = a.id AND d.decided_at > NOW() - INTERVAL '7 days') AS decisions_7d,
  (SELECT COUNT(*) FROM public.decisions d
    WHERE d.agent_id = a.id AND d.decision IN ('deny','interrupt')
      AND d.decided_at > NOW() - INTERVAL '7 days') AS enforcements_7d
FROM public.agents a
LEFT JOIN public.signals s ON s.agent_id = a.id
GROUP BY a.id;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'decisions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND tablename = 'suggestions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime setup skipped: %', SQLERRM;
END $$;

COMMIT;