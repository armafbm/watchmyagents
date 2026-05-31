
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reveal_session_ids(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_session_id_access(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purge_old_session_ids() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_session_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_session_id_access(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_session_ids() TO service_role;
