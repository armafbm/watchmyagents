// Guardian AI — LLM-based risk analysis + policy suggestion engine.
// Reads ONLY anonymized signals (Modèle C). Never sees raw URLs, prompts or commands.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const MODEL = 'google/gemini-2.5-flash';
const RECENT_HOURS = 24;
const BASELINE_DAYS = 30;
const MAX_SUGGESTIONS_PER_AGENT = 5;
const REJECT_COOLDOWN_DAYS = 7;
const SMALL_SAMPLE_THRESHOLD = 5;

interface SignalPayload {
  counts?: Record<string, number>;
  tool_counts?: Record<string, number>;
  action_counts?: Record<string, number>;
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

interface LlmRisk {
  title?: string;
  category?: string;
  score?: number;
  confidence?: number;
  rationale?: string;
  objective?: string;
  surface?: { type?: string; ref?: string };
  proposed_policy?: {
    rule_id?: string;
    name?: string;
    match?: Record<string, unknown>;
    action?: string;
    message?: string;
    priority?: number;
    enforceable_now?: boolean;
    enforcement_note?: string;
  };
}

const VALID_CATEGORIES = new Set([
  'data_exfiltration', 'tool_abuse', 'prompt_injection',
  'anomalous_volume', 'perimeter_drift', 'error_spike', 'looping', 'other',
]);
const VALID_ACTIONS = new Set(['allow', 'deny', 'interrupt']);
const VALID_SURFACES = new Set(['agent', 'type', 'fleet']);

const SYSTEM_PROMPT = `You are Guardian, the security analyst of WatchMyAgents. You review the
ANONYMIZED behaviour of one AI agent and identify security risks, then propose
deployable enforcement policies for the Shield runtime.

CRITICAL PRIVACY CONSTRAINT (Modèle C):
- You ONLY ever receive anonymized evidence: counts, distributions, salted IoC
  HASHES (e.g. "sha256:ab12…"), sequence patterns, latencies, error rates.
- You NEVER see raw URLs, commands, prompts, or file paths. Do NOT invent or
  guess concrete domains/commands. You may reference an ioc_hash verbatim, but a
  human will reveal its concrete value locally if needed.

HOW TO REASON:
- One observation window can reveal MULTIPLE distinct risks. Emit one entry per
  distinct risk (0 to 5).
- Ground every risk in the evidence (cite the numbers). Prefer precision over
  volume; do not fabricate risks when the evidence is benign.
- Score each risk 0-100 (0 benign, 100 critical) and give a confidence 0-100.
- risk_category ∈ {data_exfiltration, tool_abuse, prompt_injection,
  anomalous_volume, perimeter_drift, error_spike, looping, other}.

POLICY MATCH FORMAT (matched against each live tool event by Shield):
- Fields: "action_type" (e.g. "tool_use"), "tool_name" (string OR
  {"not_in":["web_search","web_fetch"]}), "status" (e.g. "error"), and hash
  fields like "input.url_hash" set to an exact "sha256:…" value.
- "action" ∈ {deny, interrupt, allow}.
- ENFORCEABILITY: Shield reliably enforces STRUCTURAL matches (tool_name,
  tool_name.not_in, action_type). Rate-limits and hash-based blocks are NOT yet
  natively enforced — if a risk needs those, still propose the policy but set
  "enforceable_now": false and explain in "enforcement_note". Set true only for
  structural tool-perimeter matches.
- Choose the surface the user should deploy on: "agent" (this agent), "type"
  (same-type agents), or "fleet" (all the customer's agents). Default "agent".
- Never propose a rule_id already deployed.

Respond with STRICT JSON only:
{
  "risks": [
    {
      "title": "short headline",
      "category": "one of the categories",
      "score": 0-100,
      "confidence": 0-100,
      "rationale": "why, citing the evidence numbers",
      "objective": "what deploying this achieves (the GOAL)",
      "surface": { "type": "agent|type|fleet", "ref": "human label" },
      "proposed_policy": {
        "rule_id": "kebab-case-stable-id",
        "name": "human readable name",
        "match": { "action_type": "tool_use", "tool_name": "..." },
        "action": "deny|interrupt|allow",
        "message": "shown when Shield blocks",
        "priority": 100,
        "enforceable_now": true,
        "enforcement_note": "only if enforceable_now is false"
      }
    }
  ]
}
If there is no meaningful risk, return {"risks": []}.

SMALL-SAMPLE DISCOUNTING (CRITICAL): Error rates from tiny samples are NOT
reliable. If a tool was called fewer than 5 times in the window, treat it as a
WEAK signal: cap risk_score at 40 (never CRITICAL), cap confidence at 50, and
say so explicitly in the rationale. Do NOT raise an 'error_spike' risk when the
absolute error count is below 3, regardless of the percentage.`;

function clamp(n: unknown, lo: number, hi: number, def: number) {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : def;
  return Math.max(lo, Math.min(hi, v));
}

function aggregateRecent(signals: { payload: SignalPayload }[]) {
  const tool_counts: Record<string, number> = {};
  const action_counts: Record<string, number> = {};
  const error_rate_acc: Record<string, number[]> = {};
  const stop_reasons: Record<string, number> = {};
  const ioc_freq = new Map<string, number>();
  const sequences: Record<string, number> = {};
  let tokens_total = 0;

  for (const s of signals) {
    const p = s.payload ?? {};
    for (const [k, v] of Object.entries(p.tool_counts ?? {})) tool_counts[k] = (tool_counts[k] ?? 0) + (v as number);
    for (const [k, v] of Object.entries(p.action_counts ?? {})) action_counts[k] = (action_counts[k] ?? 0) + (v as number);
    for (const [k, v] of Object.entries(p.stop_reasons ?? {})) stop_reasons[k] = (stop_reasons[k] ?? 0) + (v as number);
    for (const [k, v] of Object.entries(p.error_rate_by_tool ?? {})) {
      (error_rate_acc[k] ??= []).push(v as number);
    }
    for (const h of p.ioc_hashes ?? []) ioc_freq.set(h, (ioc_freq.get(h) ?? 0) + 1);
    for (const seq of p.sequences_top10 ?? []) {
      sequences[seq.pattern] = (sequences[seq.pattern] ?? 0) + seq.count;
    }
    tokens_total += p.tokens_total ?? 0;
  }
  const error_rate_by_tool: Record<string, number> = {};
  for (const [k, arr] of Object.entries(error_rate_acc)) {
    error_rate_by_tool[k] = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(3));
  }
  const ioc_hashes_frequent = [...ioc_freq.entries()]
    .filter(([, c]) => c >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([hash, count]) => ({ hash, count }));
  const top_sequences = Object.entries(sequences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, count]) => ({ pattern, count }));
  // Build per-tool stats: { calls, errors, error_rate } — gives the LLM the
  // absolute counts needed for small-sample discounting.
  const tool_stats: Record<string, { calls: number; errors: number; error_rate: number }> = {};
  for (const [tool, calls] of Object.entries(tool_counts)) {
    const rate = error_rate_by_tool[tool] ?? 0;
    const errors = Math.round(calls * rate);
    tool_stats[tool] = { calls, errors, error_rate: Number(rate.toFixed(3)) };
  }
  return {
    tool_counts, action_counts, error_rate_by_tool, tool_stats, stop_reasons,
    tokens_total, ioc_distinct: ioc_freq.size, ioc_hashes_frequent, top_sequences,
  };
}

function baselineTools(signals: { payload: SignalPayload }[]): string[] {
  const set = new Set<string>();
  for (const s of signals) for (const t of Object.keys(s.payload?.tool_counts ?? {})) set.add(t);
  return [...set];
}

async function callLlm(apiKey: string, evidence: unknown): Promise<{ risks: LlmRisk[] } | null> {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(evidence) },
      ],
    }),
  });
  if (!res.ok) {
    console.error('LLM call failed', res.status, await res.text());
    return null;
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (!parsed || !Array.isArray(parsed.risks)) return { risks: [] };
    return parsed as { risks: LlmRisk[] };
  } catch (e) {
    console.error('Failed to parse LLM JSON', e, content?.slice(0, 500));
    return null;
  }
}

function validateRisk(r: LlmRisk, agent: Agent, deployedRuleIds: Set<string>) {
  if (!r || typeof r !== 'object') return null;
  const pp = r.proposed_policy;
  if (!pp || !pp.match || typeof pp.match !== 'object') return null;
  const action = VALID_ACTIONS.has(pp.action ?? '') ? pp.action! : 'deny';
  const category = VALID_CATEGORIES.has(r.category ?? '') ? r.category! : 'other';
  const surfaceType = VALID_SURFACES.has(r.surface?.type ?? '') ? r.surface!.type! : 'agent';
  const ruleId = (pp.rule_id ?? `guardian-${Date.now().toString(36)}`).toString().slice(0, 80);
  if (deployedRuleIds.has(ruleId)) return null;
  const enforceableNow = pp.enforceable_now === true;
  return {
    title: (r.title ?? 'Security risk').toString().slice(0, 200),
    category,
    score: clamp(r.score, 0, 100, 50),
    confidence: clamp(r.confidence, 0, 100, 50),
    rationale: (r.rationale ?? '').toString().slice(0, 2000),
    objective: (r.objective ?? '').toString().slice(0, 1000),
    surface_type: surfaceType,
    surface_ref: (r.surface?.ref ?? agent.display_name).toString().slice(0, 200),
    proposed_policy: {
      rule_id: ruleId,
      name: (pp.name ?? r.title ?? 'Guardian policy').toString().slice(0, 200),
      match: pp.match,
      action,
      message: (pp.message ?? `Blocked by Guardian rule ${ruleId}`).toString().slice(0, 500),
      priority: typeof pp.priority === 'number' ? pp.priority : 100,
      enforceable_now: enforceableNow,
      enforcement_note: enforceableNow ? null : (pp.enforcement_note ?? 'Requires future Shield capability').toString().slice(0, 500),
    },
  };
}

type Validated = NonNullable<ReturnType<typeof validateRisk>>;

// Semantic signature for a risk: identifies the SAME underlying threat even
// when the LLM invents a new rule_id/title/message every run.
// Shape: agent|category|action_type|toolKey|status|action
function toolKeyOf(match: Record<string, unknown> | null | undefined): string {
  const t = match?.tool_name as unknown;
  if (t == null) return '';
  if (typeof t === 'string') return t;
  if (typeof t === 'object') {
    const obj = t as { not_in?: unknown; in?: unknown };
    if (Array.isArray(obj.not_in)) {
      return 'not_in:' + [...obj.not_in].map(String).sort().join(',');
    }
    if (Array.isArray(obj.in)) {
      return 'in:' + [...obj.in].map(String).sort().join(',');
    }
  }
  return JSON.stringify(t);
}

function semanticSig(
  agentId: string,
  category: string,
  match: Record<string, unknown> | null | undefined,
  action: string,
): string {
  const m = (match ?? {}) as Record<string, unknown>;
  const actionType = (m.action_type as string | undefined) ?? '';
  const status = (m.status as string | undefined) ?? '';
  return `${agentId}|${category}|${actionType}|${toolKeyOf(m)}|${status}|${action}`;
}

// Structural sig (no category) — used to compare candidates against deployed
// policies, which carry no risk_category.
function structuralSig(
  agentId: string,
  match: Record<string, unknown> | null | undefined,
  action: string,
): string {
  const m = (match ?? {}) as Record<string, unknown>;
  const actionType = (m.action_type as string | undefined) ?? '';
  const status = (m.status as string | undefined) ?? '';
  return `${agentId}|${actionType}|${toolKeyOf(m)}|${status}|${action}`;
}

function sigForValidated(v: Validated, agentId: string): string {
  return semanticSig(agentId, v.category, v.proposed_policy.match as Record<string, unknown>, v.proposed_policy.action);
}

async function filterAlreadySuggested(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  candidates: Validated[],
  deployedSigs: Set<string>,
): Promise<Validated[]> {
  if (candidates.length === 0) return candidates;

  // 1. Block forever against open (pending/accepted) suggestions for this agent.
  const { data: openRows } = await supabase
    .from('suggestions')
    .select('risk_category, proposed_match, proposed_action')
    .eq('agent_id', agentId)
    .in('status', ['pending', 'accepted']);

  const blockedSigs = new Set<string>(deployedSigs);
  for (const r of openRows ?? []) {
    const row = r as { risk_category: string | null; proposed_match: Record<string, unknown> | null; proposed_action: string };
    blockedSigs.add(semanticSig(agentId, row.risk_category ?? 'other', row.proposed_match, row.proposed_action));
  }

  // 2. Respect recent rejections (cooldown window).
  const cooldownSince = new Date(Date.now() - REJECT_COOLDOWN_DAYS * 86_400_000).toISOString();
  const { data: rejectedRows } = await supabase
    .from('suggestions')
    .select('risk_category, proposed_match, proposed_action')
    .eq('agent_id', agentId)
    .eq('status', 'rejected')
    .gt('resolved_at', cooldownSince);
  for (const r of rejectedRows ?? []) {
    const row = r as { risk_category: string | null; proposed_match: Record<string, unknown> | null; proposed_action: string };
    blockedSigs.add(semanticSig(agentId, row.risk_category ?? 'other', row.proposed_match, row.proposed_action));
  }

  // 3. Within-batch dedup: collapse same-sig candidates, keep highest risk_score.
  const bestBySig = new Map<string, Validated>();
  for (const c of candidates) {
    const sig = sigForValidated(c, agentId);
    if (blockedSigs.has(sig)) continue;
    const prev = bestBySig.get(sig);
    if (!prev || c.score > prev.score) bestBySig.set(sig, c);
  }
  return [...bestBySig.values()];
}

async function runGuardian() {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return { agents_scanned: 0, suggestions_emitted: 0, mode: MODEL, errors: ['LOVABLE_API_KEY missing'] };

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const errors: string[] = [];
  let suggestions_emitted = 0;

  const { data: agents, error: agentsErr } = await supabase
    .from('agents').select('id, customer_id, display_name').eq('status', 'active');
  if (agentsErr) return { agents_scanned: 0, suggestions_emitted: 0, mode: MODEL, errors: [agentsErr.message] };
  if (!agents || agents.length === 0) return { agents_scanned: 0, suggestions_emitted: 0, mode: MODEL, errors: [] };

  const recentSince = new Date(Date.now() - RECENT_HOURS * 3_600_000).toISOString();
  const baselineSince = new Date(Date.now() - BASELINE_DAYS * 86_400_000).toISOString();
  const decisionsSince = new Date(Date.now() - 7 * 86_400_000).toISOString();

  for (const agent of agents as Agent[]) {
    try {
      const [{ data: recent }, { data: baseline }, { data: policies }, { data: decisions }] = await Promise.all([
        supabase.from('signals').select('payload, window_start, window_end')
          .eq('agent_id', agent.id).gt('window_start', recentSince)
          .order('window_start', { ascending: false }),
        supabase.from('signals').select('payload')
          .eq('agent_id', agent.id).gt('window_start', baselineSince).lt('window_start', recentSince),
        supabase.from('policies').select('rule_id, match, action, agent_id')
          .eq('customer_id', agent.customer_id).eq('enabled', true)
          .or(`agent_id.is.null,agent_id.eq.${agent.id}`),
        supabase.from('decisions').select('tool_name, decision')
          .eq('agent_id', agent.id).gt('decided_at', decisionsSince).limit(500),
      ]);

      if (!recent || recent.length === 0) continue;

      const recentAgg = aggregateRecent(recent as { payload: SignalPayload }[]);
      const baselineTool = baselineTools((baseline ?? []) as { payload: SignalPayload }[]);
      const new_tools_vs_baseline = Object.keys(recentAgg.tool_counts).filter((t) => !baselineTool.includes(t));
      const decisionBreakdown: Record<string, Record<string, number>> = {};
      for (const d of decisions ?? []) {
        const tn = (d as { tool_name: string | null }).tool_name ?? 'unknown';
        const dec = (d as { decision: string }).decision ?? 'unknown';
        (decisionBreakdown[tn] ??= {})[dec] = (decisionBreakdown[tn]?.[dec] ?? 0) + 1;
      }

      const evidence = {
        agent: { id: agent.id, display_name: agent.display_name, customer_id: agent.customer_id },
        window: { hours: RECENT_HOURS, signal_count: recent.length },
        recent: recentAgg,
        baseline_30d: { tools_ever_seen: baselineTool, new_tools_vs_baseline },
        decisions_7d: decisionBreakdown,
        deployed_policies: (policies ?? []).map((p) => ({
          rule_id: (p as { rule_id: string }).rule_id,
          action: (p as { action: string }).action,
          match: (p as { match: unknown }).match,
          scope: (p as { agent_id: string | null }).agent_id ? 'agent' : 'fleet',
        })),
      };

      const llm = await callLlm(apiKey, evidence);
      if (!llm) {
        errors.push(`agent ${agent.id}: llm call failed`);
        continue;
      }
      const deployedRuleIds = new Set((policies ?? []).map((p) => (p as { rule_id: string }).rule_id));
      const validated = llm.risks
        .map((r) => validateRisk(r, agent, deployedRuleIds))
        .filter((v): v is Validated => v !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_SUGGESTIONS_PER_AGENT);

      const fresh = await filterAlreadySuggested(supabase, agent.id, validated);
      if (fresh.length === 0) continue;

      const rows = fresh.map((v) => ({
        customer_id: agent.customer_id,
        agent_id: agent.id,
        title: v.title,
        rationale: v.rationale,
        proposed_match: v.proposed_policy.match,
        proposed_action: v.proposed_policy.action,
        proposed_message: v.proposed_policy.message,
        risk_score: v.score,
        risk_category: v.category,
        confidence: v.confidence,
        objective: v.objective,
        surface_type: v.surface_type,
        surface_ref: v.surface_ref,
        generated_by: MODEL,
        proposed_policy: v.proposed_policy,
      }));
      const { error: insertErr } = await supabase.from('suggestions').insert(rows);
      if (insertErr) {
        errors.push(`agent ${agent.id}: ${insertErr.message}`);
        continue;
      }
      suggestions_emitted += rows.length;
    } catch (e) {
      errors.push(`agent ${agent.id}: ${(e as Error).message}`);
    }
  }

  return { agents_scanned: agents.length, suggestions_emitted, mode: MODEL, errors };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('method not allowed', { status: 405, headers: corsHeaders });
  }
  // Auth: shared secret OR service-role key. If no GUARDIAN_SECRET is set, allow
  // invocation (function deploys with verify_jwt=false; intended for trusted cron).
  const guardianSecret = Deno.env.get('GUARDIAN_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const provided = req.headers.get('x-guardian-secret') ?? '';
  const bearer = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i)?.[1] ?? '';
  const secretOk = guardianSecret ? provided === guardianSecret : true;
  const serviceOk = serviceRoleKey ? bearer === serviceRoleKey : false;
  if (guardianSecret && !secretOk && !serviceOk) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  try {
    const result = await runGuardian();
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
