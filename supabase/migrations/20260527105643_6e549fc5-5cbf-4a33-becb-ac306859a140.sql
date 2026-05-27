CREATE POLICY "Deny direct inserts to customers"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (false);