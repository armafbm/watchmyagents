import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

async function sha256Hex(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

const VALID_AGENT_TYPES = new Set([
  'coding','devops_infra','data_rag','customer_facing','browser_web',
  'orchestrator','workflow_backoffice','personal_assistant',
  'transactional_financial','generic',
]);
const VALID_STAGES = new Set(['cold_start','provisional','stable']);
// Stricter stages dominate. Overwriting a stricter stage with a looser one
// requires a high-confidence (>=0.85) new classification.
const STAGE_STRICTNESS: Record<string, number> = {
  cold_start: 0, provisional: 1, stable: 2,
};

function validateBody(b: unknown) {
  if (!b || typeof b !== 'object') return { ok: false, error: 'body must be a JSON object' };
  const o = b as Record<string, unknown>;
  if (typeof o.anthropic_agent_id !== 'string' || !o.anthropic_agent_id.startsWith('agent_'))
    return { ok: false, error: 'anthropic_agent_id required (must start with "agent_")' };
  if (typeof o.window_start !== 'string' || typeof o.window_end !== 'string')
    return { ok: false, error: 'window_start and window_end (ISO strings) required' };
  if (!o.payload || typeof o.payload !== 'object')
    return { ok: false, error: 'payload (object) required' };
  const payloadStr = JSON.stringify(o.payload);
  if (payloadStr.length > 256 * 1024)
    return { ok: false, error: 'payload too large (>256 KB)' };

  // Optional classification
  let classification: { agent_type: string; confidence: number; stage: string } | null = null;
  if (o.classification && typeof o.classification === 'object') {
    const c = o.classification as Record<string, unknown>;
    if (typeof c.agent_type !== 'string' || !VALID_AGENT_TYPES.has(c.agent_type))
      return { ok: false, error: 'classification.agent_type invalid' };
    if (typeof c.confidence !== 'number' || c.confidence < 0 || c.confidence > 1)
      return { ok: false, error: 'classification.confidence must be 0..1' };
    if (typeof c.stage !== 'string' || !VALID_STAGES.has(c.stage))
      return { ok: false, error: 'classification.stage invalid' };
    classification = { agent_type: c.agent_type, confidence: c.confidence, stage: c.stage };
  }

  return {
    ok: true,
    data: {
      anthropic_agent_id: o.anthropic_agent_id,
      display_name: typeof o.display_name === 'string' ? o.display_name : null,
      window_start: o.window_start,
      window_end: o.window_end,
      payload: o.payload,
      classification,
    },
  };
}


serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed (POST only)' });

  // Auth: Bearer wma_<32hex>
  const auth = req.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(wma_[a-f0-9]{32})\s*$/i);
  if (!match) return json(401, { error: 'missing or malformed Authorization header (expected "Bearer wma_<32hex>")' });
  const apiKey = match[1];
  const apiKeyHash = await sha256Hex(apiKey);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // Lookup the API key
  const { data: keyRow, error: keyErr } = await supabase
    .from('api_keys')
    .select('id, customer_id, revoked_at, scopes')
    .eq('hash', apiKeyHash)
    .maybeSingle();
  if (keyErr) { console.error('[ingest-signals] auth lookup:', keyErr); return json(500, { error: 'internal error' }); }
  if (!keyRow || keyRow.revoked_at) return json(401, { error: 'invalid api key' });
  if (!((keyRow as { scopes?: string[] }).scopes ?? []).includes('watch:write')) {
    return json(403, { error: 'API key lacks watch:write scope' });
  }
  const customerId = keyRow.customer_id;

  // Body
  let bodyJson: unknown;
  try { bodyJson = await req.json(); }
  catch { return json(400, { error: 'body is not valid JSON' }); }
  const v = validateBody(bodyJson);
  if (!v.ok) return json(400, { error: v.error });
  const { anthropic_agent_id, display_name, window_start, window_end, payload, classification } = v.data!;

  // Resolve or auto-register the agent
  let agentId: string;
  let registeredNew = false;
  let existingAgentType: string | null = null;
  let existingAgentStage: string | null = null;
  const { data: existing } = await supabase
    .from('agents').select('id, agent_type, agent_type_stage')
    .eq('customer_id', customerId)
    .eq('anthropic_agent_id', anthropic_agent_id)
    .maybeSingle();
  if (existing) {
    agentId = (existing as { id: string; agent_type: string | null; agent_type_stage: string | null }).id;
    existingAgentType = (existing as { agent_type: string | null }).agent_type;
    existingAgentStage = (existing as { agent_type_stage: string | null }).agent_type_stage;
  } else {
    const { data: created, error: insertErr } = await supabase
      .from('agents').insert({
        customer_id: customerId,
        anthropic_agent_id,
        display_name: display_name || anthropic_agent_id,
      }).select('id').single();
    if (insertErr) { console.error('[ingest-signals] agent auto-register:', insertErr); return json(500, { error: 'internal error' }); }
    agentId = (created as { id: string }).id;
    registeredNew = true;
  }

  // Upsert typology if provided (Modèle C: never touches policies)
  if (classification) {
    const existingStrict = existingAgentStage ? (STAGE_STRICTNESS[existingAgentStage] ?? -1) : -1;
    const incomingStrict = STAGE_STRICTNESS[classification.stage] ?? -1;
    // Allow when: no existing type, OR incoming stage is at least as strict,
    // OR (incoming less strict but confidence >= 0.85 — degradation guard).
    const allow = !existingAgentType
      || incomingStrict >= existingStrict
      || classification.confidence >= 0.85;
    if (allow) {
      await supabase.from('agents').update({
        agent_type: classification.agent_type,
        agent_type_confidence: classification.confidence,
        agent_type_stage: classification.stage,
        agent_type_updated_at: new Date().toISOString(),
      }).eq('id', agentId);
    }
  }


  // Insert the signal
  const { data: signal, error: signalErr } = await supabase
    .from('signals').insert({
      customer_id: customerId,
      agent_id: agentId,
      window_start, window_end, payload,
    }).select('id').single();
  if (signalErr) { console.error('[ingest-signals] signal insert:', signalErr); return json(500, { error: 'internal error — signal could not be recorded' }); }

  // Bump freshness (fire-and-forget)
  await Promise.all([
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id),
    supabase.from('agents').update({ last_seen_at: new Date().toISOString() }).eq('id', agentId),
  ]).catch(() => undefined);

  return json(200, {
    ok: true,
    signal_id: (signal as { id: string }).id,
    agent_id: agentId,
    registered_new_agent: registeredNew,
  });
});
