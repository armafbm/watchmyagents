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

const VALID_AGENT_TYPES = new Set([
  "coding",
  "devops_infra",
  "data_rag",
  "customer_facing",
  "browser_web",
  "orchestrator",
  "workflow_backoffice",
  "personal_assistant",
  "transactional_financial",
  "generic",
]);
const VALID_STAGES = new Set(["cold_start", "provisional", "stable"]);
// Stricter stages dominate. Overwriting a stricter stage with a looser one
// requires a high-confidence (>=0.85) new classification.
const STAGE_STRICTNESS: Record<string, number> = {
  cold_start: 0,
  provisional: 1,
  stable: 2,
};

const VALID_PROVIDERS = new Set([
  "anthropic-managed",
  "openai-agents",
  "langgraph",
  "aws-bedrock-agentcore",
  "crewai",
  "generic",
]);

function validateBody(b: unknown) {
  if (!b || typeof b !== "object") return { ok: false, error: "body must be a JSON object" };
  const o = b as Record<string, unknown>;

  // provider (new canonical, default to anthropic-managed for legacy SDKs)
  const provider = typeof o.provider === "string" ? o.provider : "anthropic-managed";
  if (!VALID_PROVIDERS.has(provider))
    return { ok: false, error: `provider invalid (allowed: ${[...VALID_PROVIDERS].join(", ")})` };

  // native_agent_id (new canonical, fallback to anthropic_agent_id)
  const nativeRaw =
    typeof o.native_agent_id === "string"
      ? o.native_agent_id
      : typeof o.anthropic_agent_id === "string"
        ? o.anthropic_agent_id
        : null;
  if (!nativeRaw || typeof nativeRaw !== "string" || nativeRaw.length < 1 || nativeRaw.length > 256)
    return { ok: false, error: "native_agent_id required (or legacy anthropic_agent_id)" };
  if (provider === "anthropic-managed" && !nativeRaw.startsWith("agent_"))
    return { ok: false, error: 'anthropic-managed native_agent_id must start with "agent_"' };

  if (typeof o.window_start !== "string" || typeof o.window_end !== "string")
    return { ok: false, error: "window_start and window_end (ISO strings) required" };
  if (!o.payload || typeof o.payload !== "object")
    return { ok: false, error: "payload (object) required" };
  const payloadStr = JSON.stringify(o.payload);
  if (payloadStr.length > 256 * 1024) return { ok: false, error: "payload too large (>256 KB)" };

  // Optional classification
  let classification: { agent_type: string; confidence: number; stage: string } | null = null;
  if (o.classification && typeof o.classification === "object") {
    const c = o.classification as Record<string, unknown>;
    if (typeof c.agent_type !== "string" || !VALID_AGENT_TYPES.has(c.agent_type))
      return { ok: false, error: "classification.agent_type invalid" };
    if (typeof c.confidence !== "number" || c.confidence < 0 || c.confidence > 1)
      return { ok: false, error: "classification.confidence must be 0..1" };
    if (typeof c.stage !== "string" || !VALID_STAGES.has(c.stage))
      return { ok: false, error: "classification.stage invalid" };
    classification = { agent_type: c.agent_type, confidence: c.confidence, stage: c.stage };
  }

  // Optional sub-agent hierarchy
  let parent_agent_id: string | null = null;
  if (typeof o.parent_agent_id === "string" && o.parent_agent_id.length > 0) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(o.parent_agent_id))
      return { ok: false, error: "parent_agent_id must be a UUID" };
    parent_agent_id = o.parent_agent_id;
  }
  const VALID_COMPOSITION = new Set(["solo", "hierarchy", "graph", "peer"]);
  let composition_pattern = "solo";
  if (typeof o.composition_pattern === "string") {
    if (!VALID_COMPOSITION.has(o.composition_pattern))
      return { ok: false, error: "composition_pattern invalid" };
    composition_pattern = o.composition_pattern;
  }

  // Optional enforcement_mode (defaults to sync_confirm for legacy Anthropic clients)
  const VALID_ENFORCEMENT = new Set(["sync_confirm", "sync_interrupt", "detect_only"]);
  let enforcement_mode = "sync_confirm";
  if (typeof o.enforcement_mode === "string") {
    if (!VALID_ENFORCEMENT.has(o.enforcement_mode))
      return { ok: false, error: "enforcement_mode invalid" };
    enforcement_mode = o.enforcement_mode;
  }

  // Optional opaque vendor session ids (v1.0.2+). Validated, but NEVER logged.
  //
  // FORT-3 (P1 Codex audit): the SDK puts session_ids inside `payload`
  // (the SignalsAggregator output that gets uploaded), not at the root
  // of the request body. The previous code only read `o.session_ids`
  // which was the legacy path — so Fortress silently received an empty
  // list even when the SDK was forwarding ids. reveal/audit functions
  // were returning empty rows in prod because of this mismatch.
  //
  // Resolve order: payload.session_ids (current SDK shape) → root
  // session_ids (legacy fallback, kept for old client versions until
  // we sunset them).
  const payloadObj =
    o.payload && typeof o.payload === "object" ? (o.payload as Record<string, unknown>) : null;
  const rawSessionIds =
    payloadObj && Array.isArray(payloadObj.session_ids)
      ? payloadObj.session_ids
      : Array.isArray(o.session_ids)
        ? o.session_ids
        : null;
  let session_ids: string[] | null = null;
  if (rawSessionIds) {
    if (rawSessionIds.length > 256) return { ok: false, error: "session_ids: max 256 entries" };
    const clean: string[] = [];
    for (const s of rawSessionIds) {
      if (typeof s !== "string" || s.length < 1 || s.length > 256)
        return { ok: false, error: "session_ids: each entry must be a string of 1..256 chars" };
      clean.push(s);
    }
    session_ids = clean.length > 0 ? clean : null;
  }

  return {
    ok: true,
    data: {
      provider,
      native_agent_id: nativeRaw,
      display_name: typeof o.display_name === "string" ? o.display_name : null,
      window_start: o.window_start,
      window_end: o.window_end,
      payload: o.payload,
      classification,
      parent_agent_id,
      composition_pattern,
      enforcement_mode,
      session_ids,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method not allowed (POST only)" });

  // Auth: Bearer wma_<32hex>
  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(wma_[a-f0-9]{32})\s*$/i);
  if (!match)
    return json(401, {
      error: 'missing or malformed Authorization header (expected "Bearer wma_<32hex>")',
    });
  const apiKey = match[1];
  const apiKeyHash = await sha256Hex(apiKey);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Lookup the API key + customer plan in one round-trip
  const { data: keyRow, error: keyErr } = await supabase
    .from("api_keys")
    .select("id, customer_id, revoked_at, scopes, customers!inner(plan)")
    .eq("hash", apiKeyHash)
    .maybeSingle();
  if (keyErr) {
    console.error("[ingest-signals] auth lookup:", keyErr);
    return json(500, { error: "internal error" });
  }
  if (!keyRow || keyRow.revoked_at) return json(401, { error: "invalid api key" });
  if (!((keyRow as { scopes?: string[] }).scopes ?? []).includes("watch:write")) {
    return json(403, { error: "API key lacks watch:write scope" });
  }
  const customerId = keyRow.customer_id;
  const customerPlan: string =
    (keyRow as unknown as { customers: { plan: string } }).customers?.plan ?? "free";

  // Rate limit — signals per minute per customer, keyed by plan
  const RATE_LIMITS: Record<string, number> = {
    free: 20,
    pro: 60,
    pro_plus: 300,
    business: 3000,
    advanced: 6000,
  };
  const rateLimit = RATE_LIMITS[customerPlan] ?? 20;
  const windowStart60s = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCount, error: rateErr } = await supabase
    .from("signals")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .gte("ingested_at", windowStart60s);
  if (rateErr) {
    console.error("[ingest-signals] rate check:", rateErr);
    return json(500, { error: "internal error" });
  }
  if ((recentCount ?? 0) >= rateLimit) {
    return json(429, {
      error: `rate limit exceeded (${rateLimit} signals/min on ${customerPlan} plan)`,
      retry_after: 60,
    });
  }

  // Body
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return json(400, { error: "body is not valid JSON" });
  }
  const v = validateBody(bodyJson);
  if (!v.ok) return json(400, { error: v.error });
  const {
    provider,
    native_agent_id,
    display_name,
    window_start,
    window_end,
    payload,
    classification,
    parent_agent_id,
    composition_pattern,
    enforcement_mode,
    session_ids,
  } = v.data!;

  // Resolve parent_agent_id within this tenant (race-safe: leave NULL if not found yet)
  let resolvedParentId: string | null = null;
  if (parent_agent_id) {
    const { data: parentRow } = await supabase
      .from("agents")
      .select("id")
      .eq("customer_id", customerId)
      .eq("id", parent_agent_id)
      .maybeSingle();
    if (parentRow) resolvedParentId = (parentRow as { id: string }).id;
  }

  // Resolve or auto-register the agent — keyed on (customer, provider, native_agent_id)
  let agentId: string;
  let registeredNew = false;
  let existingAgentType: string | null = null;
  let existingAgentStage: string | null = null;
  let existingParentId: string | null = null;
  const { data: existing } = await supabase
    .from("agents")
    .select("id, agent_type, agent_type_stage, parent_agent_id")
    .eq("customer_id", customerId)
    .eq("provider", provider)
    .eq("native_agent_id", native_agent_id)
    .maybeSingle();
  if (existing) {
    agentId = (existing as { id: string }).id;
    existingAgentType = (existing as { agent_type: string | null }).agent_type;
    existingAgentStage = (existing as { agent_type_stage: string | null }).agent_type_stage;
    existingParentId = (existing as { parent_agent_id: string | null }).parent_agent_id;
  } else {
    const { data: created, error: insertErr } = await supabase
      .from("agents")
      .insert({
        customer_id: customerId,
        provider,
        native_agent_id,
        anthropic_agent_id: provider === "anthropic-managed" ? native_agent_id : null,
        display_name: display_name || native_agent_id,
        parent_agent_id: resolvedParentId,
        composition_pattern,
        enforcement_mode,
      })
      .select("id")
      .single();
    if (insertErr) {
      console.error("[ingest-signals] agent auto-register:", insertErr);
      return json(500, { error: "internal error" });
    }
    agentId = (created as { id: string }).id;
    registeredNew = true;
  }

  // Always persist composition_pattern + enforcement_mode; backfill parent_agent_id if newly resolved.
  const lineageUpdate: Record<string, unknown> = { composition_pattern, enforcement_mode };
  if (resolvedParentId && resolvedParentId !== existingParentId) {
    lineageUpdate.parent_agent_id = resolvedParentId;
  }
  if (existing) {
    await supabase.from("agents").update(lineageUpdate).eq("id", agentId);
  }

  // Upsert typology if provided (Modèle C: never touches policies)
  if (classification) {
    const existingStrict = existingAgentStage ? (STAGE_STRICTNESS[existingAgentStage] ?? -1) : -1;
    const incomingStrict = STAGE_STRICTNESS[classification.stage] ?? -1;
    // Allow when: no existing type, OR incoming stage is at least as strict,
    // OR (incoming less strict but confidence >= 0.85 — degradation guard).
    const allow =
      !existingAgentType || incomingStrict >= existingStrict || classification.confidence >= 0.85;
    if (allow) {
      await supabase
        .from("agents")
        .update({
          agent_type: classification.agent_type,
          agent_type_confidence: classification.confidence,
          agent_type_stage: classification.stage,
          agent_type_updated_at: new Date().toISOString(),
        })
        .eq("id", agentId);
    }
  }

  // Insert the signal
  const { data: signal, error: signalErr } = await supabase
    .from("signals")
    .insert({
      customer_id: customerId,
      agent_id: agentId,
      window_start,
      window_end,
      payload,
      session_ids,
    })
    .select("id")
    .single();
  if (signalErr) {
    console.error("[ingest-signals] signal insert:", signalErr);
    return json(500, { error: "internal error — signal could not be recorded" });
  }

  // Bump freshness (fire-and-forget)
  await Promise.all([
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id),
    supabase.from("agents").update({ last_seen_at: new Date().toISOString() }).eq("id", agentId),
  ]).catch(() => undefined);

  return json(200, {
    ok: true,
    signal_id: (signal as { id: string }).id,
    agent_id: agentId,
    registered_new_agent: registeredNew,
  });
});
