
-- Enable Vault for storing signing private keys
create extension if not exists supabase_vault with schema vault;

-- ============================================================
-- signing_keys: chain-of-trust signing keys (root-signed)
-- ============================================================
create table public.signing_keys (
  kid text primary key,
  pubkey text not null,
  private_key_ref text not null,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  signed_by_root text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index signing_keys_validity
  on public.signing_keys (valid_from, valid_until)
  where revoked_at is null;

grant select, insert, update, delete on public.signing_keys to authenticated;
grant all on public.signing_keys to service_role;

alter table public.signing_keys enable row level security;

create policy signing_keys_select_operator
  on public.signing_keys for select to authenticated
  using (public.has_role(auth.uid(), 'operator'::public.app_role));

create policy signing_keys_insert_operator
  on public.signing_keys for insert to authenticated
  with check (public.has_role(auth.uid(), 'operator'::public.app_role));

create policy signing_keys_update_operator
  on public.signing_keys for update to authenticated
  using (public.has_role(auth.uid(), 'operator'::public.app_role))
  with check (public.has_role(auth.uid(), 'operator'::public.app_role));

-- Public list view exposing pubkeys only (no private_key_ref) for customer SDK fetch
create view public.signing_keys_public as
  select kid, pubkey, valid_from, valid_until, signed_by_root, revoked_at
  from public.signing_keys;

grant select on public.signing_keys_public to authenticated, anon;

-- ============================================================
-- policies: add signature columns
-- ============================================================
alter table public.policies
  add column signature text,
  add column signing_key_id text references public.signing_keys(kid),
  add column signed_at timestamptz;

create index policies_unsigned on public.policies (id) where signature is null;

-- ============================================================
-- decisions: add verification_status for SDK telemetry
-- ============================================================
alter table public.decisions
  add column verification_status text;

alter table public.decisions
  add constraint decisions_verification_status_chk
  check (verification_status is null
         or verification_status in ('verified','unsigned','sig_invalid','unknown_kid'));

create index decisions_verification_failed
  on public.decisions (customer_id, decided_at desc)
  where verification_status in ('unsigned','sig_invalid','unknown_kid');
