-- Prevent authenticated users from self-escalating their plan tier.
-- Revoke blanket UPDATE, then re-grant only on safe columns.
REVOKE UPDATE ON public.customers FROM authenticated;
GRANT UPDATE(display_name, email) ON public.customers TO authenticated;

-- Ensure service_role retains full access
GRANT ALL ON public.customers TO service_role;