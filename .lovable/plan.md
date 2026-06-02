# Fortress Ed25519 Policy Signing Pipeline

Implement the chain-of-trust (Root → Signing Key → Policy) so SDK v1.1.5 can verify every policy. Ship Lovable-side first; SDK publish happens after backfill.

## Architecture note (TanStack Start, not Edge Functions)

Per project stack rules, "Edge Functions" in the brief are implemented as **TanStack server functions** (`createServerFn`) for internal ops, and **server routes** under `src/routes/api/public/*` only if external HTTP is needed. `get-policies` becomes a server fn called by customer dashboards/SDK proxy; signing logic lives in server fns guarded by an operator role.

`node:crypto` Ed25519 (`generateKeyPairSync`, `sign`, `verify`) works in the Worker SSR runtime — confirmed in server-runtime allowlist.

## 1. Database migrations

**`signing_keys` table** (operator-only; service_role writes, authenticated reads limited to non-secret columns via view).

```sql
create table public.signing_keys (
  kid text primary key,
  pubkey text not null,
  private_key_ref text not null,         -- Vault secret name
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  signed_by_root text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index signing_keys_validity on public.signing_keys (valid_from, valid_until)
  where revoked_at is null;
```

GRANTs: `service_role` ALL; `authenticated` SELECT on a **view** that excludes `private_key_ref` (so customer get-policies can read pubkeys). RLS: deny all direct table SELECT to authenticated; view is `security_invoker=false`.

**Extend `policies`**:
```sql
alter table public.policies
  add column signature text,
  add column signing_key_id text references public.signing_keys(kid),
  add column signed_at timestamptz;
```

**Operator role**: add `'operator'` to `app_role` enum, use existing `has_role()` helper for guards.

## 2. Crypto helpers (`src/lib/policy-signing.server.ts`)

- `canonicalize(value)` — exact JCS-lite per brief.
- `policySigningPayload(p)` — fields `[rule_id, match, action, message, priority, mode]`, missing → null.
- `signingKeyPayload({kid,pubkey,valid_from,valid_until})` — canonical.
- `signEd25519(privateKeyPem, payload) → base64`
- `verifyEd25519(pubkeyBase64Raw, payload, sigBase64) → boolean` (wraps 32-byte raw into SPKI DER).

## 3. Server functions (`src/lib/fortress-signing.functions.ts`)

All `createServerFn` + `requireSupabaseAuth` + operator role check (except `getPolicies` which is customer-scoped).

- **`mintSigningKey`** (operator): validates input shape; verifies `signed_by_root` against `WMA_FORTRESS_ROOT_PUBKEY_B64` env; calls Vault to store private key under `private_key_secret_name`; inserts row via `supabaseAdmin`.
- **`signPolicy({policyId})`** (operator/owner): loads policy, picks current signing key (`valid_from <= now < valid_until AND revoked_at IS NULL ORDER BY valid_from DESC LIMIT 1`), reads its private key from Vault, signs canonical payload, updates `policies` row.
- **`revokeSigningKey({kid})`** (operator): sets `revoked_at = now()`; returns affected policy count & customer count.
- **`listSigningKeys`** (operator): full rows + counts joined from `policies`.
- **`getPoliciesForCustomer`** (auth'd customer): returns brief's response shape, including `signing_keys[]` filtered to non-revoked + overlapping window (now-90d, now+30d).
- **`backfillSignPolicies`** (operator one-shot): iterates unsigned policies, calls `signPolicy` for each.

## 4. Auto-sign on policy mutation

Update existing policy create/update server fns to call `signPolicy` after write (best-effort; log on failure, never block save — the operator can re-sign).

## 5. Vault integration

Use Supabase Vault via `supabaseAdmin.rpc('vault.create_secret', ...)` / `vault.decrypted_secrets` view. Helper in `src/lib/vault.server.ts`:
- `storeSecret(name, value) → ref`
- `readSecret(ref) → value`

If Vault extension isn't enabled, migration enables it (`create extension if not exists supabase_vault`).

## 6. Root pubkey secret

Add **runtime secret** `WMA_FORTRESS_ROOT_PUBKEY_B64` via add_secret tool — operator will paste the base64 pubkey from the offline ceremony (§10 of brief).

## 7. UI — Operator Signing Keys page

`src/routes/_authenticated/dashboard.operator.signing-keys.tsx` (guarded: redirect if not operator).

- Table: `kid`, validity window, status chip (active / scheduled / expired / revoked), policy count.
- **Mint key wizard** (modal/stepper):
  1. Generate kid + validity inputs.
  2. Show the **offline ceremony snippet** with the canonical payload pre-filled — operator runs locally on air-gapped machine.
  3. Operator pastes `pubkey`, `signed_by_root` sig, and the Vault secret name (after uploading the priv key via Settings → Secrets).
  4. Submit → `mintSigningKey`.
- **Revoke** button → confirmation modal with impact preview (X policies, Y customers) → `revokeSigningKey`.
- **Backfill** button (visible if any unsigned policies exist).

Add sidebar entry in `DashboardLayout` under an "Operator" section, only rendered when `useRole('operator')` is true.

## 8. UI — Policy editor signature chip

Augment existing policy detail/list:
- Signature chip: 🟢 active / 🟡 expired-but-valid / 🔴 unsigned.
- "Re-sign" button → calls `signPolicy`.

## 9. Telemetry — verification failures

- Extend `decisions` ingestion (existing `ingest-decisions` path) to accept `verification_status: 'verified' | 'unsigned' | 'sig_invalid' | 'unknown_kid'`. No schema change required if stored in payload jsonb, but for fast filtering add a nullable column:
  ```sql
  alter table public.decisions add column verification_status text;
  ```
- Add Reports filter "Verification failed" → `verification_status IN ('unsigned','sig_invalid','unknown_kid')`.

## 10. Acceptance test

End-to-end script (`scripts/verify-chain.mjs`):
1. Fetch `getPoliciesForCustomer` payload.
2. For each signing key: `verifyEd25519(rootPubkey, signingKeyPayload(sk), sk.signed_by_root)`.
3. For each policy: lookup `signing_key_id`, `verifyEd25519(sk.pubkey, policySigningPayload(p), p.signature)`.
4. Assert all pass.

## Technical details

**File layout**
```
supabase/migrations/<ts>_signing_keys.sql
supabase/migrations/<ts>_policies_signature_cols.sql
supabase/migrations/<ts>_decisions_verification_status.sql
supabase/migrations/<ts>_app_role_operator.sql
src/lib/policy-signing.server.ts        # canonicalize + crypto
src/lib/vault.server.ts                  # Vault helpers
src/lib/fortress-signing.functions.ts    # mint/sign/revoke/list/getPolicies/backfill
src/hooks/useRole.ts                     # operator gate
src/routes/_authenticated/dashboard.operator.signing-keys.tsx
src/components/operator/MintKeyWizard.tsx
src/components/operator/RevokeKeyDialog.tsx
src/components/policies/SignatureChip.tsx
scripts/verify-chain.mjs
```

**Secrets required**
- `WMA_FORTRESS_ROOT_PUBKEY_B64` (runtime secret — add now, paste pubkey after offline ceremony).

**Sequencing**
1. Migration batch (4 SQL files).
2. Server crypto + functions.
3. Add secret (pause for user).
4. Operator UI + policy chip.
5. Auto-sign hook on policy CRUD.
6. Run backfill from UI button.
7. Hand off pubkey + signal SDK ready to publish.

## Out of scope (per brief)
- Sentinel SLM classifier.
- SDK telemetry extension (post-v1.1.5 coordination).
- Cron-based key rotation reminders.

---

Confirm and I'll start with the migrations, then request `WMA_FORTRESS_ROOT_PUBKEY_B64` before wiring the mint flow.