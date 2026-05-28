-- Block plan tier escalation by authenticated users via a BEFORE UPDATE trigger.
-- Service role (used by trusted server-side code / webhooks) bypasses the check.

CREATE OR REPLACE FUNCTION public.prevent_customer_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND COALESCE(current_setting('request.jwt.claim.role', true), auth.role()) <> 'service_role' THEN
    RAISE EXCEPTION 'plan can only be changed by service role'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_prevent_plan_change ON public.customers;
CREATE TRIGGER customers_prevent_plan_change
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_customer_plan_change();

-- Tighten the self-update policy with an explicit WITH CHECK so the row
-- after the update still belongs to the same user (defense in depth).
DROP POLICY IF EXISTS customers_update_self ON public.customers;
CREATE POLICY customers_update_self
ON public.customers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());