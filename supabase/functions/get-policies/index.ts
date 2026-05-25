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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json(405, { error: 'method not allowed (GET only)' });

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
    .from('api_keys').select('id, customer_id, revoked_at')
    .eq('hash', apiKeyHash).maybeSingle();
  if (keyErr) return json(500, { error: 'auth lookup failed' });
  if (!keyRow || keyRow.revoked_at) return json(401, { error: 'invalid api key' });
  const customerId = keyRow.customer_id;

  let url: URL;
  try { url = new URL(req.url); } catch { return json(400, { error: 'invalid request url' }); }
  const filterAnthropicAgentId = url.searchParams.get('agent_id');

  let agentUuid: string | null = null;
  if (filterAnthropicAgentId) {
    if (!/^agent_[a-zA-Z0-9]+$/.test(filterAnthropicAgentId)) {
      return json(400, { error: 'invalid agent_id format' });
    }
    const { data: agent } = await supabase
      .from('agents').select('id')
      .eq('customer_id', customerId)
      .eq('anthropic_agent_id', filterAnthropicAgentId)
      .maybeSingle();
    if (!agent) {
      return json(200, { ok: true, fetched_at: new Date().toISOString(), policies: [] });
    }
    agentUuid = (agent as { id: string }).id;
  }

  let query = supabase
    .from('policies')
    .select('id, rule_id, name, rationale, match, action, message, priority, agent_id')
    .eq('customer_id', customerId)
    .eq('enabled', true)
    .order('priority', { ascending: true });

  if (agentUuid !== null) {
    query = query.or(`agent_id.is.null,agent_id.eq.${agentUuid}`);
  } else {
    query = query.is('agent_id', null);
  }

  const { data: policies, error: policiesErr } = await query;
  if (policiesErr) return json(500, { error: `policies lookup failed: ${policiesErr.message}` });

  supabase.from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(() => undefined, () => undefined);

  return json(200, {
    ok: true,
    fetched_at: new Date().toISOString(),
    policies: policies || [],
  });
});
