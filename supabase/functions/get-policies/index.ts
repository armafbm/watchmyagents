import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

async function sha256Hex(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json(405, { error: "method not allowed (GET only)" });

  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(wma_[a-f0-9]{32})\s*$/i);
  if (!match) return json(401, { error: "missing or malformed Authorization header" });
  const apiKey = match[1];
  const apiKeyHash = await sha256Hex(apiKey);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: keyRow, error: keyErr } = await supabase
    .from("api_keys")
    .select("id, customer_id, revoked_at, scopes")
    .eq("hash", apiKeyHash)
    .maybeSingle();
  if (keyErr) {
    console.error("[get-policies] auth lookup:", keyErr);
    return json(500, { error: "internal error" });
  }
  if (!keyRow || keyRow.revoked_at) return json(401, { error: "invalid api key" });
  if (!((keyRow as { scopes?: string[] }).scopes ?? []).includes("shield:read")) {
    return json(403, { error: "API key lacks shield:read scope" });
  }
  const customerId = keyRow.customer_id;

  let url: URL;
  try {
    url = new URL(req.url);
  } catch {
    return json(400, { error: "invalid request url" });
  }
  const filterAnthropicAgentId = url.searchParams.get("agent_id");

  let agentUuid: string | null = null;
  let agentType: string | null = null;
  const ancestorIds: string[] = []; // self + parents up the chain
  if (filterAnthropicAgentId) {
    if (!/^agent_[a-zA-Z0-9]+$/.test(filterAnthropicAgentId)) {
      return json(400, { error: "invalid agent_id format" });
    }
    const { data: agent } = await supabase
      .from("agents")
      .select("id, agent_type, parent_agent_id")
      .eq("customer_id", customerId)
      .eq("anthropic_agent_id", filterAnthropicAgentId)
      .maybeSingle();
    if (!agent) {
      return json(200, { ok: true, fetched_at: new Date().toISOString(), policies: [] });
    }
    agentUuid = (agent as { id: string }).id;
    agentType = (agent as { agent_type: string | null }).agent_type;

    // Walk up parent chain (cap depth 10 to prevent loops)
    ancestorIds.push(agentUuid);
    let currentParent = (agent as { parent_agent_id: string | null }).parent_agent_id;
    for (let i = 0; i < 10 && currentParent; i++) {
      if (ancestorIds.includes(currentParent)) break; // cycle guard
      ancestorIds.push(currentParent);
      const { data: parentRow } = await supabase
        .from("agents")
        .select("parent_agent_id")
        .eq("customer_id", customerId)
        .eq("id", currentParent)
        .maybeSingle();
      currentParent = parentRow
        ? (parentRow as { parent_agent_id: string | null }).parent_agent_id
        : null;
    }
  }

  // Surface-aware resolution.
  //   fleet                          => always applies
  //   agent (this agent)             => surface_type='agent' AND agent_id = this
  //   type  (this agent's type)      => surface_type='type'  AND surface_ref = this.agent_type
  //   subtree                        => surface_type='subtree' AND surface_ref in ancestor chain
  // Back-compat: rows with NULL surface_type were backfilled (fleet when agent_id null, agent otherwise).
  //
  // FORT-2 (P0 Codex audit): signature + signing_key_id are now in the
  // select so the response matches the shape the SDK v1.1.5+ verifier
  // (verifyPolicyBundle) requires. Without these fields, every policy
  // would be dropped in strict mode and Shield would enforce nothing.
  let query = supabase
    .from("policies")
    .select(
      "id, rule_id, name, rationale, match, action, message, mode, priority, agent_id, surface_type, surface_ref, signature, signing_key_id",
    )
    .eq("customer_id", customerId)
    .eq("enabled", true)
    .order("priority", { ascending: true });

  if (agentUuid !== null) {
    const orParts = [
      `surface_type.eq.fleet`,
      `and(surface_type.eq.agent,agent_id.eq.${agentUuid})`,
    ];
    if (agentType) orParts.push(`and(surface_type.eq.type,surface_ref.eq.${agentType})`);
    if (ancestorIds.length > 0) {
      orParts.push(`and(surface_type.eq.subtree,surface_ref.in.(${ancestorIds.join(",")}))`);
    }
    query = query.or(orParts.join(","));
  } else {
    query = query.eq("surface_type", "fleet");
  }

  const { data: policies, error: policiesErr } = await query;
  if (policiesErr) {
    console.error("[get-policies] policies lookup:", policiesErr);
    return json(500, { error: "internal error" });
  }

  // FORT-2 (P0 Codex audit): the SDK v1.1.5+ chain-of-trust verifier
  // (src/shield/signature.js#verifyPolicyBundle) needs the signing
  // keys alongside the policies so it can chain
  // policy.signature -> signing_key.pubkey -> root pubkey embedded in
  // the SDK. We return any non-revoked signing key whose validity
  // window overlaps a generous bracket (90d back, 30d ahead) so the
  // verifier can validate older signed policies during a rotation
  // overlap. Same window logic as src/lib/fortress-signing.functions.ts
  // getPoliciesForCustomer — keep these two paths in sync.
  const now = Date.now();
  const lookbackMs = 90 * 24 * 3600 * 1000;
  const aheadMs = 30 * 24 * 3600 * 1000;
  const windowStart = new Date(now - lookbackMs).toISOString();
  const windowEnd = new Date(now + aheadMs).toISOString();

  const { data: signingKeys, error: keysErr } = await supabase
    .from("signing_keys_public")
    .select("kid, pubkey, valid_from, valid_until, signed_by_root")
    .is("revoked_at", null)
    .lt("valid_from", windowEnd)
    .gt("valid_until", windowStart);
  if (keysErr) {
    console.error("[get-policies] signing_keys lookup:", keysErr);
    return json(500, { error: "internal error" });
  }

  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(
      () => undefined,
      () => undefined,
    );

  return json(200, {
    ok: true,
    fetched_at: new Date().toISOString(),
    policies: policies || [],
    // FORT-2: SDK chain-of-trust shape (signing_keys array).
    signing_keys: signingKeys || [],
  });
});
