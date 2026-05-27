-- Defense-in-depth: explicit deny SELECT/UPDATE/DELETE on early_access_signups for anon/authenticated.
-- Service role still has full access (bypasses RLS).
CREATE POLICY "Deny read access to early access signups"
ON public.early_access_signups
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "Deny update to early access signups"
ON public.early_access_signups
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Deny delete to early access signups"
ON public.early_access_signups
FOR DELETE
TO anon, authenticated
USING (false);