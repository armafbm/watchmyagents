drop policy if exists signing_keys_select_public on public.signing_keys;

revoke select on public.signing_keys from anon;
revoke select on public.signing_keys from authenticated;
grant select (kid, pubkey, valid_from, valid_until, signed_by_root, created_at, revoked_at)
  on public.signing_keys to authenticated;

revoke all on public.guardian_scan_queue from anon;
revoke all on public.guardian_scan_queue from authenticated;
comment on table public.guardian_scan_queue is
  'Internal queue. Accessed exclusively via service_role (RLS bypass). No client policies by design.';