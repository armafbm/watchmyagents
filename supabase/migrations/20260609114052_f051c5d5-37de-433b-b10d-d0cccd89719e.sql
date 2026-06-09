
-- 1. Set search_path on all public functions missing it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.purge_old_data() SET search_path = public;
ALTER FUNCTION public.plan_agent_limit(text) SET search_path = public;
ALTER FUNCTION public.plan_policy_limit(text) SET search_path = public;
ALTER FUNCTION public.plan_api_key_limit(text) SET search_path = public;
ALTER FUNCTION public.enforce_agent_limit() SET search_path = public;
ALTER FUNCTION public.enforce_policy_limit() SET search_path = public;
ALTER FUNCTION public.enforce_api_key_limit() SET search_path = public;
ALTER FUNCTION public.plan_retention_days(text) SET search_path = public;

-- 2. Set security_invoker on loop_overview_v (others already have it)
ALTER VIEW public.loop_overview_v SET (security_invoker = on);

-- 3. Restrict avatar listing: replace broad public SELECT with authenticated-only.
-- Direct CDN URLs still work because the bucket is public; only the list/select API is locked down.
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_authenticated_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
