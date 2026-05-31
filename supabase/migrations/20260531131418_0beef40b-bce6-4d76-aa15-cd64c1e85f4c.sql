
-- 1. Roles system (none existed before)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('viewer','incident_analyst','security_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_select_self ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 2. signals.session_ids
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS session_ids text[];

-- 3. Audit log (append-only)
CREATE TABLE IF NOT EXISTS public.session_id_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('reveal','copy','export')),
  session_id text NOT NULL,
  signal_id uuid REFERENCES public.signals(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_id_audit_log_user
  ON public.session_id_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_id_audit_log_customer
  ON public.session_id_audit_log(customer_id, created_at DESC);

GRANT SELECT ON public.session_id_audit_log TO authenticated;
GRANT ALL ON public.session_id_audit_log TO service_role;

ALTER TABLE public.session_id_audit_log ENABLE ROW LEVEL SECURITY;

-- Append-only: SELECT for tenant; no INSERT/UPDATE/DELETE policies for end-users
CREATE POLICY session_id_audit_select_self ON public.session_id_audit_log
  FOR SELECT TO authenticated USING (customer_id = auth.uid());

-- 4. Settings table (for retention TTL)
CREATE TABLE IF NOT EXISTS public.fortress_settings (
  customer_id uuid PRIMARY KEY,
  session_ids_retention_days int NOT NULL DEFAULT 90 CHECK (session_ids_retention_days BETWEEN 1 AND 365),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.fortress_settings TO authenticated;
GRANT ALL ON public.fortress_settings TO service_role;

ALTER TABLE public.fortress_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY fortress_settings_all_self ON public.fortress_settings
  FOR ALL TO authenticated
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

-- 5. RPC: reveal session ids (RBAC + audit)
CREATE OR REPLACE FUNCTION public.reveal_session_ids(p_signal_id uuid)
RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_customer uuid;
  v_ids text[];
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT (public.has_role(v_user, 'incident_analyst') OR public.has_role(v_user, 'security_admin')) THEN
    RAISE EXCEPTION 'forbidden: incident_analyst or security_admin role required';
  END IF;
  SELECT customer_id, session_ids INTO v_customer, v_ids
    FROM public.signals WHERE id = p_signal_id;
  IF v_customer IS NULL THEN RAISE EXCEPTION 'signal not found'; END IF;
  IF v_customer <> v_user THEN RAISE EXCEPTION 'forbidden: cross-tenant'; END IF;

  -- Audit each revealed id
  IF v_ids IS NOT NULL THEN
    INSERT INTO public.session_id_audit_log (user_id, action, session_id, signal_id, customer_id)
    SELECT v_user, 'reveal', unnest(v_ids), p_signal_id, v_customer;
  END IF;

  RETURN v_ids;
END $$;

GRANT EXECUTE ON FUNCTION public.reveal_session_ids(uuid) TO authenticated;

-- 6. RPC: record a copy/export action
CREATE OR REPLACE FUNCTION public.log_session_id_access(
  p_signal_id uuid, p_session_id text, p_action text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_customer uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_action NOT IN ('reveal','copy','export') THEN RAISE EXCEPTION 'invalid action'; END IF;
  IF p_signal_id IS NOT NULL THEN
    SELECT customer_id INTO v_customer FROM public.signals WHERE id = p_signal_id;
    IF v_customer IS NULL OR v_customer <> v_user THEN RAISE EXCEPTION 'forbidden'; END IF;
  ELSE
    v_customer := v_user;
  END IF;
  INSERT INTO public.session_id_audit_log (user_id, action, session_id, signal_id, customer_id)
  VALUES (v_user, p_action, p_session_id, p_signal_id, v_customer);
END $$;

GRANT EXECUTE ON FUNCTION public.log_session_id_access(uuid, text, text) TO authenticated;

-- 7. Retention sweep (callable from pg_cron)
CREATE OR REPLACE FUNCTION public.purge_old_session_ids()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rows int;
BEGIN
  WITH per_tenant AS (
    SELECT s.id
      FROM public.signals s
      LEFT JOIN public.fortress_settings f ON f.customer_id = s.customer_id
     WHERE s.session_ids IS NOT NULL
       AND s.ingested_at < now() - make_interval(days => COALESCE(f.session_ids_retention_days, 90))
  )
  UPDATE public.signals SET session_ids = NULL
   WHERE id IN (SELECT id FROM per_tenant);
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END $$;

-- Schedule daily at 03:17 UTC
DO $$ BEGIN
  PERFORM cron.schedule(
    'purge-old-session-ids',
    '17 3 * * *',
    $cron$ SELECT public.purge_old_session_ids(); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not available in this environment; safe to ignore (manual call still works)
  NULL;
END $$;
