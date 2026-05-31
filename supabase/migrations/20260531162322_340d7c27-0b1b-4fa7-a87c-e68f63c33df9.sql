ALTER FUNCTION public.schedule_guardian_scan() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.schedule_guardian_scan() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_guardian_scan() TO service_role;