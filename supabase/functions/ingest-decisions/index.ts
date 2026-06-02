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

const VALID_DECISIONS = new Set(['allow', 'deny', 'interrupt']);
const VALID_MODES = new Set(['enforce', 'shadow']);

function validateBody(b: unknown) {
  if (!b || typeof b !== 'object') return { ok: false, error: 'body must be a JSON object' };
  const o = b as Record<string, unknown>;
  if (typeof o.anthropic_agent_id !== 'string'
      || !/^agent_[a-zA-Z0-9]+$/.test(o.anthropic_agent_id))
    return { ok: false, error: 'anthropic_agent_id required' };
  if (typeof o.decision !== 'string' || !VALID_DECISIONS.has(o.decision))
    return { ok: false, error: 'decision must be allow, deny, or interrupt' };
  if (o.mode !== undefined && (typeof o.mode !== 'string' || !VALID_MODES.has(o.mode)))
    return { ok: false, error: 'mode must be enforce or shadow' };
  const result = {
    anthropic_agent_id: o.anthropic_agent_id as string,
    decision: o.decision as 'allow' | 'deny' | 'interrupt',
    mode: (o.mode as 'enforce' | 'shadow' | undefined) ?? 'enforce',
    rule_id: typeof o.rule_id === 'string' ? o.rule_id : null,
    session_hash: typeof o.session_hash === 'string' ? o.session_hash : null,
    event_id_hash: typeof o.event_id_hash === 'string' ? o.event_id_hash : null,
    input_hash: typeof o.input_hash === 'string' ? o.input_hash : null,
    action_type: typeof o.action_type === 'string' ? o.action_type : null,
    tool_name: typeof o.tool_name === 'string' ? o.tool_name : null,
    message: typeof o.message === 'string' ? o.message.slice(0, 500) : null,
    decided_at: typeof o.decided_at === 'string' ? o.decided_at : new Date().toISOString(),
    decided_in_ms: typeof o.decided_in_ms === 'number' ? o.decided_in_ms : null,
  };
  if (o.decided_at && Number.isNaN(new Date(result.decided_at).getTime()))
    return { ok: false, error: 'decided_at must be a valid ISO 8601 timestamp' };
  return { ok: true, data: result };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed (POST only)' });

  const auth = req.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(wma_[a-f0-9]{32})\s*$/i);
  if (!match) return json(401, { error: 'missing or malformed Authorization header' });
  const apiKey = match[1];
  const apiKeyHash = await sha256Hex(apiKey);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data: keyRow, error: keyErr } = await supabase
    .from('api_keys').select('id, customer_id, revoked_at, scopes')
    .eq('hash', apiKeyHash).maybeSingle();
  if (keyErr) { console.error('[ingest-decisions] auth lookup:', keyErr); return json(500, { error: 'internal error' }); }
  if (!keyRow || keyRow.revoked_at) return json(401, { error: 'invalid api key' });
  if (!((keyRow as { scopes?: string[] }).scopes ?? []).includes('decisions:write')) {
    return json(403, { error: 'API key lacks decisions:write scope' });
  }
  const customerId = keyRow.customer_id;

  let bodyJson: unknown;
  try { bodyJson = await req.json(); }
  catch { return json(400, { error: 'body is not valid JSON' }); }
  const v = validateBody(bodyJson);
  if (!v.ok) return json(400, { error: v.error });
  const d = v.data!;

  const { data: agent, error: agentErr } = await supabase
    .from('agents').select('id')
    .eq('customer_id', customerId)
    .eq('anthropic_agent_id', d.anthropic_agent_id)
    .maybeSingle();
  if (agentErr) { console.error('[ingest-decisions] agent lookup:', agentErr); return json(500, { error: 'internal error' }); }
  if (!agent) return json(404, { error: `agent "${d.anthropic_agent_id}" not registered yet — POST a signal first` });
  const agentId = (agent as { id: string }).id;

  let policyId: string | null = null;
  if (d.rule_id) {
    const { data: policy } = await supabase
      .from('policies').select('id')
      .eq('customer_id', customerId).eq('rule_id', d.rule_id)
      .maybeSingle();
    if (policy) policyId = (policy as { id: string }).id;
  }

  const { data: decision, error: insertErr } = await supabase
    .from('decisions').insert({
      customer_id: customerId,
      agent_id: agentId,
      policy_id: policyId,
      decision: d.decision,
      mode: d.mode,
      session_hash: d.session_hash,
      event_id_hash: d.event_id_hash,
      input_hash: d.input_hash,
      action_type: d.action_type,
      tool_name: d.tool_name,
      message: d.message,
      decided_at: d.decided_at,
      decided_in_ms: d.decided_in_ms,
    }).select('id').single();
  if (insertErr) { console.error('[ingest-decisions] insert failed:', insertErr); return json(500, { error: 'internal error — decision could not be recorded' }); }

  Promise.all([
    supabase.from('agents').update({ last_seen_at: new Date().toISOString() }).eq('id', agentId),
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id),
  ]).catch(() => undefined);

  return json(200, {
    ok: true,
    decision_id: (decision as { id: string }).id,
    agent_id: agentId,
  });
});
