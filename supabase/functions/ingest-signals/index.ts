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
  return {
    ok: true,
    data: {
      anthropic_agent_id: o.anthropic_agent_id,
      display_name: typeof o.display_name === 'string' ? o.display_name : null,
      window_start: o.window_start,
      window_end: o.window_end,
      payload: o.payload,
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
    .select('id, customer_id, revoked_at')
    .eq('hash', apiKeyHash)
    .maybeSingle();
  if (keyErr) return json(500, { error: 'auth lookup failed' });
  if (!keyRow || keyRow.revoked_at) return json(401, { error: 'invalid api key' });
  const customerId = keyRow.customer_id;

  // Body
  let bodyJson: unknown;
  try { bodyJson = await req.json(); }
  catch { return json(400, { error: 'body is not valid JSON' }); }
  const v = validateBody(bodyJson);
  if (!v.ok) return json(400, { error: v.error });
  const { anthropic_agent_id, display_name, window_start, window_end, payload } = v.data!;

  // Resolve or auto-register the agent
  let agentId: string;
  let registeredNew = false;
  const { data: existing } = await supabase
    .from('agents').select('id')
    .eq('customer_id', customerId)
    .eq('anthropic_agent_id', anthropic_agent_id)
    .maybeSingle();
  if (existing) {
    agentId = (existing as { id: string }).id;
  } else {
    const { data: created, error: insertErr } = await supabase
      .from('agents').insert({
        customer_id: customerId,
        anthropic_agent_id,
        display_name: display_name || anthropic_agent_id,
      }).select('id').single();
    if (insertErr) return json(500, { error: 'agent auto-register failed: ' + insertErr.message });
    agentId = (created as { id: string }).id;
    registeredNew = true;
  }

  // Insert the signal
  const { data: signal, error: signalErr } = await supabase
    .from('signals').insert({
      customer_id: customerId,
      agent_id: agentId,
      window_start, window_end, payload,
    }).select('id').single();
  if (signalErr) return json(500, { error: 'signal insert failed: ' + signalErr.message });

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
