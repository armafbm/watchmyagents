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
  let agentFleetId: string | null = null;
  let agentTeamIds: string[] = [];
  const ancestorIds: string[] = []; // self + parents up the chain

  if (filterAnthropicAgentId) {
    if (!/^agent_[a-zA-Z0-9]+$/.test(filterAnthropicAgentId)) {
      return json(400, { error: "invalid agent_id format" });
    }
    const { data: agent } = await supabase
      .from("agents")
      .select("id, agent_type, parent_agent_id, fleet_id")
      .eq("customer_id", customerId)
      .eq("anthropic_agent_id", filterAnthropicAgentId)
      .maybeSingle();
    if (!agent) {
      return json(200, { ok: true, fetched_at: new Date().toISOString(), policies: [] });
    }
    agentUuid = (agent as { id: string }).id;
    agentType = (agent as { agent_type: string | null }).agent_type;
    agentFleetId = (agent as { fleet_id: string | null }).fleet_id;

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

    // Look up team memberships for this agent
    const { data: memberships } = await supabase
      .from("agent_team_membership")
      .select("team_id")
      .eq("agent_id", agentUuid);
    agentTeamIds = (memberships ?? []).map(
      (m: { team_id: string }) => m.team_id,
    );
  }

  // Surface-aware resolution:
  //   fleet (catch-all, surface_ref IS NULL) → applies to all agents of this customer
  //   fleet (named, surface_ref = fleet_id)  → applies to agents in that fleet
  //   team  (surface_ref = team_id)          → applies to agents member of that team
  //   agent (surface_ref = agent_id)         → this specific agent
  //   subtree                                → this agent AND all ancestors
  //   type  (surface_ref = agent_type)       → all agents of that type
  //
  // FORT-2 (P0 Codex audit): signature + signing_key_id are in the select
  // so the SDK v1.1.5+ verifier (verifyPolicyBundle) can chain-verify.
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
      // Whole-fleet catch-all (no surface_ref)
      `and(surface_type.eq.fleet,surface_ref.is.null)`,
      // This specific agent
      `and(surface_type.eq.agent,agent_id.eq.${agentUuid})`,
    ];

    // Named fleet policy (only if this agent belongs to a fleet)
    if (agentFleetId) {
      orParts.push(`and(surface_type.eq.fleet,surface_ref.eq.${agentFleetId})`);
    }

    // Team policies (one OR clause per team membership)
    for (const teamId of agentTeamIds) {
      orParts.push(`and(surface_type.eq.team,surface_ref.eq.${teamId})`);
    }

    // Agent-type policies
    if (agentType) orParts.push(`and(surface_type.eq.type,surface_ref.eq.${agentType})`);

    // Subtree policies (applies to this agent and any ancestor in its chain)
    if (ancestorIds.length > 0) {
      orParts.push(`and(surface_type.eq.subtree,surface_ref.in.(${ancestorIds.join(",")}))`);
    }

    query = query.or(orParts.join(","));
  } else {
    // No agent_id filter → return whole-fleet catch-all policies only
    query = query.eq("surface_type", "fleet").is("surface_ref", null);
  }

  const { data: policies, error: policiesErr } = await query;
  if (policiesErr) {
    console.error("[get-policies] policies lookup:", policiesErr);
    return json(500, { error: "internal error" });
  }

  // FORT-2 (P0 Codex audit): the SDK v1.1.5+ chain-of-trust verifier
  // (src/shield/signature.js#verifyPolicyBundle) needs signing keys so
  // it can chain: policy.signature → signing_key.pubkey → root pubkey.
  // Return keys whose validity window overlaps 90d back / 30d ahead.
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

  // Fire-and-forget last_used_at update
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => undefined, () => undefined);

  return json(200, {
    ok: true,
    fetched_at: new Date().toISOString(),
    policies: policies || [],
    signing_keys: signingKeys || [],
  });
});
