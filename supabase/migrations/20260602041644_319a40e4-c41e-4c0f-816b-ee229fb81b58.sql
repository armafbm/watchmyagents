
-- Recreate view with security_invoker = true (fixes Security Definer View lint)
drop view if exists public.signing_keys_public;
create view public.signing_keys_public
  with (security_invoker = true) as
  select kid, pubkey, valid_from, valid_until, signed_by_root, revoked_at
  from public.signing_keys;
grant select on public.signing_keys_public to authenticated, anon;

-- Allow public read of non-secret columns on signing_keys via column-level privileges.
-- RLS still gates row access; we add a public-read policy and revoke the secret column.
revoke select on public.signing_keys from authenticated;
revoke select on public.signing_keys from anon;
grant select (kid, pubkey, valid_from, valid_until, signed_by_root, created_at, revoked_at)
  on public.signing_keys to authenticated, anon;
grant select (private_key_ref) on public.signing_keys to service_role;

-- Public-read RLS policy (non-secret columns only thanks to column grants above)
create policy signing_keys_select_public
  on public.signing_keys for select
  to authenticated, anon
  using (true);
