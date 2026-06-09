-- ============================================================
-- Pricing plan limits — DB-side enforcement
-- Triggers fire BEFORE INSERT on agents, policies, api_keys.
-- NULL limit = unlimited (advanced plan).
-- Error message format: 'plan_limit_exceeded:<resource>' — parsed by UI.
-- ============================================================

-- ----------------------------------------------------------------
-- Limit functions (immutable — change here propagates to all triggers)
-- Keep in sync with PLAN_LIMITS in src/hooks/usePlanLimits.ts
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_agent_limit(plan text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE plan
    WHEN 'pro'       THEN 10
    WHEN 'pro_plus'  THEN 50
    WHEN 'business'  THEN 500
    WHEN 'advanced'  THEN NULL
    ELSE 3
  END;
$$;

CREATE OR REPLACE FUNCTION public.plan_policy_limit(plan text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE plan
    WHEN 'pro'       THEN 25
    WHEN 'pro_plus'  THEN 100
    WHEN 'business'  THEN 500
    WHEN 'advanced'  THEN NULL
    ELSE 5
  END;
$$;

CREATE OR REPLACE FUNCTION public.plan_api_key_limit(plan text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE plan
    WHEN 'pro'       THEN 3
    WHEN 'pro_plus'  THEN 5
    WHEN 'business'  THEN 10
    WHEN 'advanced'  THEN NULL
    ELSE 1
  END;
$$;

-- ----------------------------------------------------------------
-- Trigger: agents
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_agent_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cust_plan text;
  lim       int;
  curr      int;
BEGIN
  SELECT plan INTO cust_plan FROM public.customers WHERE id = NEW.customer_id;
  lim := public.plan_agent_limit(cust_plan);
  IF lim IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO curr FROM public.agents WHERE customer_id = NEW.customer_id;
  IF curr >= lim THEN
    RAISE EXCEPTION 'plan_limit_exceeded:agents (current %, limit %, plan %)',
      curr, lim, cust_plan;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_agent_limit_trigger ON public.agents;
CREATE TRIGGER enforce_agent_limit_trigger
  BEFORE INSERT ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_agent_limit();

-- ----------------------------------------------------------------
-- Trigger: policies
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_policy_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cust_plan text;
  lim       int;
  curr      int;
BEGIN
  SELECT plan INTO cust_plan FROM public.customers WHERE id = NEW.customer_id;
  lim := public.plan_policy_limit(cust_plan);
  IF lim IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO curr FROM public.policies WHERE customer_id = NEW.customer_id;
  IF curr >= lim THEN
    RAISE EXCEPTION 'plan_limit_exceeded:policies (current %, limit %, plan %)',
      curr, lim, cust_plan;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_policy_limit_trigger ON public.policies;
CREATE TRIGGER enforce_policy_limit_trigger
  BEFORE INSERT ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.enforce_policy_limit();

-- ----------------------------------------------------------------
-- Trigger: api_keys (counts only active/non-revoked keys)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_api_key_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cust_plan text;
  lim       int;
  curr      int;
BEGIN
  SELECT plan INTO cust_plan FROM public.customers WHERE id = NEW.customer_id;
  lim := public.plan_api_key_limit(cust_plan);
  IF lim IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO curr
    FROM public.api_keys
   WHERE customer_id = NEW.customer_id
     AND revoked_at IS NULL;
  IF curr >= lim THEN
    RAISE EXCEPTION 'plan_limit_exceeded:api_keys (current %, limit %, plan %)',
      curr, lim, cust_plan;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_api_key_limit_trigger ON public.api_keys;
CREATE TRIGGER enforce_api_key_limit_trigger
  BEFORE INSERT ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.enforce_api_key_limit();

-- ----------------------------------------------------------------
-- Also enforce in ingest-signals auto-register path:
-- The trigger on agents already covers the Edge Function since it
-- uses service_role which still fires BEFORE INSERT triggers.
-- No extra work needed for that path.
-- ----------------------------------------------------------------
