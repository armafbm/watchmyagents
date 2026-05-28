-- 1. customers: convert permissive deny to RESTRICTIVE
DROP POLICY IF EXISTS "Deny direct inserts to customers" ON public.customers;
CREATE POLICY "Deny direct inserts to customers"
ON public.customers
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 2. decisions: restrictive deny of INSERT for non-service-role callers
CREATE POLICY "decisions_block_client_insert"
ON public.decisions
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 3. signals: same
CREATE POLICY "signals_block_client_insert"
ON public.signals
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);