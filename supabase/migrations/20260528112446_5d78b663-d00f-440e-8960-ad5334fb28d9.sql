
-- 1. Lock down customers.update so users can't change their plan
DROP POLICY IF EXISTS "customers_update_self" ON public.customers;

CREATE POLICY "customers_update_self_no_plan"
ON public.customers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND plan IS NOT DISTINCT FROM (SELECT plan FROM public.customers WHERE id = auth.uid())
);

-- 2. Split decisions ALL policy into per-command policies (no direct INSERT for authenticated)
DROP POLICY IF EXISTS "decisions_all_self" ON public.decisions;

CREATE POLICY "decisions_select_self"
ON public.decisions
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "decisions_update_self"
ON public.decisions
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "decisions_delete_self"
ON public.decisions
FOR DELETE
TO authenticated
USING (customer_id = auth.uid());

-- 3. Same split for signals
DROP POLICY IF EXISTS "signals_all_self" ON public.signals;

CREATE POLICY "signals_select_self"
ON public.signals
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "signals_update_self"
ON public.signals
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "signals_delete_self"
ON public.signals
FOR DELETE
TO authenticated
USING (customer_id = auth.uid());
