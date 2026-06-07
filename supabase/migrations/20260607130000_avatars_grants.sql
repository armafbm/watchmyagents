-- ─────────────────────────────────────────────────────────────────────────
-- Follow-up to 20260607120000_avatars_storage.sql
-- ─────────────────────────────────────────────────────────────────────────
--
-- The first migration added the avatar_url column and an RLS policy
-- (customers_update_self, from 20260525112844) but never granted the
-- corresponding table-level UPDATE privilege to the authenticated role.
-- PostgreSQL requires BOTH the GRANT and a permissive policy for the
-- UPDATE to succeed; without the GRANT, the user hits
-- "permission denied for table customers" before RLS is even consulted.
--
-- Grant only the columns the app is allowed to mutate from the client
-- — display_name (Save profile form) and avatar_url (avatar upload).
-- Plan, email, created_at, etc. stay GRANT-less so a compromised JWT
-- can never change them. The existing RLS policy still scopes the row
-- to id = auth.uid().

GRANT UPDATE (display_name, avatar_url) ON public.customers TO authenticated;
