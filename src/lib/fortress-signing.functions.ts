// Fortress Ed25519 chain-of-trust server functions.
// - mintSigningKey / revokeSigningKey / listSigningKeys: operator-only
// - signPolicy / backfillSignPolicies: operator
// - getPoliciesForCustomer: any authenticated user, returns the SDK payload

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  policySigningPayload,
  signEd25519,
  signingKeyPayload,
  verifyEd25519,
} from "./policy-signing.server";
import { readVaultSecret, storeVaultSecret } from "./vault.server";

// ---------- role gate ----------

async function assertOperator(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "operator")
    .maybeSingle();
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: operator role required");
}

function rootPubkey(): string {
  const v = process.env.WMA_FORTRESS_ROOT_PUBKEY_B64;
  if (!v) {
    throw new Error(
      "WMA_FORTRESS_ROOT_PUBKEY_B64 secret is not set. Add it under Cloud secrets after the offline root-key ceremony.",
    );
  }
  return v;
}

// ---------- mintSigningKey ----------

const mintInput = z.object({
  kid: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_\-]+$/),
  pubkey: z.string().min(40).max(60),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  signed_by_root: z.string().min(40).max(200),
  private_key_secret_name: z
    .string()
    .min(3)
    .max(128)
    .regex(/^[a-zA-Z0-9_\-]+$/),
  private_key_pem: z.string().min(40).max(8192).optional(),
});

export const mintSigningKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => mintInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertOperator(context.userId);

    if (new Date(data.valid_from) >= new Date(data.valid_until)) {
      throw new Error("valid_from must be before valid_until");
    }

    // Verify the root signature over the canonical signing-key payload.
    const payload = signingKeyPayload({
      kid: data.kid,
      pubkey: data.pubkey,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
    });
    const ok = verifyEd25519(rootPubkey(), payload, data.signed_by_root);
    if (!ok) {
      throw new Error(
        "signed_by_root signature does not verify against the configured root public key",
      );
    }

    // If the operator provided the private key inline (one-shot ceremony),
    // stash it in Vault under the named ref. Otherwise we trust the ref exists.
    if (data.private_key_pem) {
      await storeVaultSecret(
        data.private_key_secret_name,
        data.private_key_pem,
        `Fortress signing key ${data.kid}`,
      );
    }

    const { error } = await supabaseAdmin.from("signing_keys").insert({
      kid: data.kid,
      pubkey: data.pubkey,
      private_key_ref: data.private_key_secret_name,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      signed_by_root: data.signed_by_root,
    });
    if (error) throw new Error(error.message);

    return { ok: true, kid: data.kid };
  });

// ---------- pickActiveSigningKey ----------

async function pickActiveSigningKey() {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("signing_keys")
    .select("kid, pubkey, private_key_ref, valid_from, valid_until")
    .is("revoked_at", null)
    .lte("valid_from", nowIso)
    .gt("valid_until", nowIso)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No active signing key. Mint one first.");
  return data as {
    kid: string;
    pubkey: string;
    private_key_ref: string;
    valid_from: string;
    valid_until: string;
  };
}

// ---------- signPolicy ----------

const signPolicyInput = z.object({ policyId: z.string().uuid() });

export const signPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => signPolicyInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertOperator(context.userId);

    const { data: policy, error: pe } = await supabaseAdmin
      .from("policies")
      .select("id, rule_id, match, action, message, priority, mode")
      .eq("id", data.policyId)
      .maybeSingle();
    if (pe) throw new Error(pe.message);
    if (!policy) throw new Error("Policy not found");

    const key = await pickActiveSigningKey();
    const pem = await readVaultSecret(key.private_key_ref);
    const payload = policySigningPayload(policy);
    const signature = signEd25519(pem, payload);

    const { error: ue } = await supabaseAdmin
      .from("policies")
      .update({
        signature,
        signing_key_id: key.kid,
        signed_at: new Date().toISOString(),
      })
      .eq("id", policy.id);
    if (ue) throw new Error(ue.message);

    return { ok: true, kid: key.kid };
  });

// ---------- backfillSignPolicies ----------

export const backfillSignPolicies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOperator(context.userId);

    const key = await pickActiveSigningKey();
    const pem = await readVaultSecret(key.private_key_ref);

    const { data: unsigned, error } = await supabaseAdmin
      .from("policies")
      .select("id, rule_id, match, action, message, priority, mode")
      .is("signature", null);
    if (error) throw new Error(error.message);

    let signed = 0;
    const nowIso = new Date().toISOString();
    for (const p of unsigned ?? []) {
      const sig = signEd25519(pem, policySigningPayload(p));
      const { error: ue } = await supabaseAdmin
        .from("policies")
        .update({
          signature: sig,
          signing_key_id: key.kid,
          signed_at: nowIso,
        })
        .eq("id", (p as { id: string }).id);
      if (!ue) signed += 1;
    }

    return { ok: true, signed, kid: key.kid };
  });

// ---------- revokeSigningKey ----------

const revokeInput = z.object({ kid: z.string().min(1).max(64) });

export const revokeSigningKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => revokeInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertOperator(context.userId);

    const { count: affectedPolicies } = await supabaseAdmin
      .from("policies")
      .select("id", { count: "exact", head: true })
      .eq("signing_key_id", data.kid);

    const { data: customerRows } = await supabaseAdmin
      .from("policies")
      .select("customer_id")
      .eq("signing_key_id", data.kid);
    const affectedCustomers = new Set(
      (customerRows ?? []).map((r) => (r as { customer_id: string }).customer_id),
    ).size;

    const { error } = await supabaseAdmin
      .from("signing_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("kid", data.kid);
    if (error) throw new Error(error.message);

    return {
      ok: true,
      affected_policies: affectedPolicies ?? 0,
      affected_customers: affectedCustomers,
    };
  });

// ---------- listSigningKeys ----------

export const listSigningKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOperator(context.userId);

    const { data: keys, error } = await supabaseAdmin
      .from("signing_keys")
      .select(
        "kid, pubkey, private_key_ref, valid_from, valid_until, signed_by_root, created_at, revoked_at",
      )
      .order("valid_from", { ascending: false });
    if (error) throw new Error(error.message);

    // Counts per key
    const { data: countRows } = await supabaseAdmin
      .from("policies")
      .select("signing_key_id");
    const counts = new Map<string, number>();
    for (const r of (countRows ?? []) as Array<{ signing_key_id: string | null }>) {
      if (!r.signing_key_id) continue;
      counts.set(r.signing_key_id, (counts.get(r.signing_key_id) ?? 0) + 1);
    }

    const { count: unsigned } = await supabaseAdmin
      .from("policies")
      .select("id", { count: "exact", head: true })
      .is("signature", null);

    return {
      keys: (keys ?? []).map((k) => ({
        ...(k as Record<string, unknown>),
        policy_count: counts.get((k as { kid: string }).kid) ?? 0,
      })),
      unsigned_policies: unsigned ?? 0,
    };
  });

// ---------- getPoliciesForCustomer ----------

export const getPoliciesForCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const { data: policies, error: pe } = await supabaseAdmin
      .from("policies")
      .select(
        "rule_id, match, action, message, priority, mode, signature, signing_key_id",
      )
      .eq("customer_id", userId)
      .eq("enabled", true);
    if (pe) throw new Error(pe.message);

    const now = Date.now();
    const lookbackMs = 90 * 24 * 3600 * 1000;
    const aheadMs = 30 * 24 * 3600 * 1000;
    const windowStart = new Date(now - lookbackMs).toISOString();
    const windowEnd = new Date(now + aheadMs).toISOString();

    const { data: keys, error: ke } = await supabaseAdmin
      .from("signing_keys_public")
      .select("kid, pubkey, valid_from, valid_until, signed_by_root, revoked_at")
      .is("revoked_at", null)
      .lt("valid_from", windowEnd)
      .gt("valid_until", windowStart);
    if (ke) throw new Error(ke.message);

    return {
      ok: true,
      fetched_at: new Date().toISOString(),
      policies: policies ?? [],
      signing_keys: (keys ?? []).map((k) => {
        const row = k as {
          kid: string;
          pubkey: string;
          valid_from: string;
          valid_until: string;
          signed_by_root: string;
        };
        return {
          kid: row.kid,
          pubkey: row.pubkey,
          valid_from: row.valid_from,
          valid_until: row.valid_until,
          signed_by_root: row.signed_by_root,
        };
      }),
    };
  });

// ---------- mintRoleForUser (bootstrap helper) ----------
// Self-grant operator role; ONLY allowed when no operator exists yet.
export const claimFirstOperator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "operator")
      .limit(1);
    if (error) throw new Error(error.message);
    if ((existing ?? []).length > 0) {
      throw new Error("An operator already exists. Ask them to grant you the role.");
    }
    const { error: ie } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "operator" });
    if (ie) throw new Error(ie.message);
    return { ok: true };
  });
