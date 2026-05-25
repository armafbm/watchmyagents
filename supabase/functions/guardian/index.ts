import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const CONFIG = {
  windowHours: 24,
  iocFrequencyThreshold: 5,
  enableNewToolSuggestions: true,
  errorRateThreshold: 0.2,
  maxSuggestionsPerAgent: 5,
};

interface SignalPayload {
  counts?: Record<string, number>;
  tool_counts?: Record<string, number>;
  latencies_p50_ms?: Record<string, number>;
  latencies_p95_ms?: Record<string, number>;
  ioc_hashes?: string[];
  sequences_top10?: Array<{ pattern: string; count: number }>;
  stop_reasons?: Record<string, number>;
  tokens_total?: number;
  error_rate_by_tool?: Record<string, number>;
}

interface Agent {
  id: string;
  customer_id: string;
  display_name: string;
}

interface Signal {
  id: string;
  customer_id: string;
  agent_id: string;
  window_start: string;
  window_end: string;
  payload: SignalPayload;
}

interface SuggestionInput {
  customer_id: string;
  agent_id: string;
  title: string;
  rationale: string;
  proposed_match: Record<string, unknown>;
  proposed_action: 'allow' | 'deny' | 'interrupt';
  proposed_message: string;
}

function detectHighFrequencyIocs(signals: Signal[], agent: Agent): SuggestionInput[] {
  const hashCounts = new Map<string, number>();
  for (const s of signals) {
    for (const h of s.payload.ioc_hashes ?? []) {
      hashCounts.set(h, (hashCounts.get(h) ?? 0) + 1);
    }
  }
  const suggestions: SuggestionInput[] = [];
  for (const [hash, count] of hashCounts) {
    if (count < CONFIG.iocFrequencyThreshold) continue;
    suggestions.push({
      customer_id: agent.customer_id,
      agent_id: agent.id,
      title: `Repeated IoC observed ${count}x this week`,
      rationale: `An IoC hash (${hash.slice(0, 16)}...) was seen ${count} times in the last ${CONFIG.windowHours}h on agent "${agent.display_name}".`,
      proposed_match: {
        action_type: 'tool_use',
        tool_name: 'web_fetch',
        'input.url_hash': hash,
      },
      proposed_action: 'deny',
      proposed_message: 'Blocked by Guardian-suggested rule (high-frequency IoC)',
    });
  }
  return suggestions;
}

async function detectBaselineDrift(
  supabase: ReturnType<typeof createClient>,
  signals: Signal[],
  agent: Agent,
): Promise<SuggestionInput[]> {
  if (!CONFIG.enableNewToolSuggestions) return [];
  const recentTools = new Set<string>();
  for (const s of signals) {
    for (const t of Object.keys(s.payload.tool_counts ?? {})) recentTools.add(t);
  }
  if (recentTools.size === 0) return [];
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: historic } = await supabase
    .from('signals')
    .select('payload')
    .eq('agent_id', agent.id)
    .lt('window_end', signals[0]?.window_start ?? new Date().toISOString())
    .gte('window_start', since);
  const historicTools = new Set<string>();
  for (const row of historic ?? []) {
    const payload = (row as { payload: SignalPayload }).payload;
    for (const t of Object.keys(payload.tool_counts ?? {})) historicTools.add(t);
  }
  const newTools = [...recentTools].filter((t) => !historicTools.has(t));
  if (newTools.length === 0) return [];
  return [{
    customer_id: agent.customer_id,
    agent_id: agent.id,
    title: `New tool(s) used outside baseline: ${newTools.join(', ')}`,
    rationale: `Agent "${agent.display_name}" started using ${newTools.length} new tool(s) in the last ${CONFIG.windowHours}h not in its 30-day history. Consider locking the tool perimeter.`,
    proposed_match: {
      action_type: 'tool_use',
      tool_name: { not_in: [...historicTools] },
    },
    proposed_action: 'deny',
    proposed_message: "Tool outside this agent's historical perimeter",
  }];
}

function detectErrorSpikes(signals: Signal[], agent: Agent): SuggestionInput[] {
  const errorRates = new Map<string, number[]>();
  for (const s of signals) {
    for (const [tool, rate] of Object.entries(s.payload.error_rate_by_tool ?? {})) {
      if (!errorRates.has(tool)) errorRates.set(tool, []);
      errorRates.get(tool)!.push(rate);
    }
  }
  const suggestions: SuggestionInput[] = [];
  for (const [tool, rates] of errorRates) {
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    if (avg < CONFIG.errorRateThreshold) continue;
    suggestions.push({
      customer_id: agent.customer_id,
      agent_id: agent.id,
      title: `Elevated error rate on tool "${tool}" (${(avg * 100).toFixed(0)}%)`,
      rationale: `Tool "${tool}" had ${(avg * 100).toFixed(1)}% error rate over the last ${CONFIG.windowHours}h. Consider rate limiting or temporary block.`,
      proposed_match: {
        action_type: 'tool_use',
        tool_name: tool,
        status: 'error',
      },
      proposed_action: 'deny',
      proposed_message: `Tool ${tool} disabled by Guardian (elevated error rate)`,
    });
  }
  return suggestions;
}

async function filterAlreadySuggested(
  supabase: ReturnType<typeof createClient>,
  suggestions: SuggestionInput[],
): Promise<SuggestionInput[]> {
  if (suggestions.length === 0) return suggestions;
  const filtered: SuggestionInput[] = [];
  for (const s of suggestions) {
    const { count } = await supabase
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', s.agent_id)
      .eq('proposed_match', JSON.stringify(s.proposed_match))
      .in('status', ['pending', 'accepted'])
      .gt('generated_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
    if ((count ?? 0) === 0) filtered.push(s);
  }
  return filtered;
}

async function runGuardian() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const errors: string[] = [];
  let suggestionsEmitted = 0;
  const { data: agents, error: agentsErr } = await supabase
    .from('agents').select('id, customer_id, display_name').eq('status', 'active');
  if (agentsErr) {
    return { agents_scanned: 0, suggestions_emitted: 0, errors: [agentsErr.message] };
  }
  if (!agents || agents.length === 0) {
    return { agents_scanned: 0, suggestions_emitted: 0, errors: [] };
  }
  const windowStart = new Date(Date.now() - CONFIG.windowHours * 3600 * 1000).toISOString();
  for (const agent of agents as Agent[]) {
    try {
      const { data: signals } = await supabase
        .from('signals')
        .select('id, customer_id, agent_id, window_start, window_end, payload')
        .eq('agent_id', agent.id)
        .gt('window_start', windowStart)
        .order('window_start', { ascending: false });
      if (!signals || signals.length === 0) continue;
      const candidates: SuggestionInput[] = [
        ...detectHighFrequencyIocs(signals as Signal[], agent),
        ...(await detectBaselineDrift(supabase, signals as Signal[], agent)),
        ...detectErrorSpikes(signals as Signal[], agent),
      ].slice(0, CONFIG.maxSuggestionsPerAgent);
      const fresh = await filterAlreadySuggested(supabase, candidates);
      if (fresh.length === 0) continue;
      const { error: insertErr } = await supabase.from('suggestions').insert(fresh);
      if (insertErr) {
        errors.push(`agent ${agent.id}: ${insertErr.message}`);
        continue;
      }
      suggestionsEmitted += fresh.length;
    } catch (e) {
      errors.push(`agent ${agent.id}: ${(e as Error).message}`);
    }
  }
  return { agents_scanned: agents.length, suggestions_emitted: suggestionsEmitted, errors };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('method not allowed', { status: 405, headers: corsHeaders });
  }
  try {
    const result = await runGuardian();
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
