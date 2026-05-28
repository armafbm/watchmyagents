// Guardian AI Chat — conversational assistant for the operator.
// Uses Lovable AI Gateway with Gemini. Read-only: it can summarize signals,
// suggestions and policies for the calling user.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const MODEL = 'google/gemini-2.5-flash';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are Guardian, the conversational security analyst of WatchMyAgents Fortress.
You help the operator understand their AI-agent fleet: pending suggestions, deployed Shield
policies, recent anonymized telemetry, risk trends.

RULES:
- Be concise, technical, friendly. Use short paragraphs and bullet lists.
- Use the CONTEXT block (real data from the user's tenant) when answering. Never invent
  agent names, scores, or policies that aren't there.
- If the user asks something outside the security/observability scope, gently steer back.
- You can ONLY ever see anonymized counts, distributions, salted hashes — never raw URLs,
  prompts, or commands. Say so if the user asks for raw content.
- When proposing actions, suggest using the Guardian "Run scan now" button or the Shield
  policies page; never claim you applied a change yourself.
- Respond in the same language the user uses.`;

async function buildContext(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
) {
  const [agentsR, suggR, polR] = await Promise.all([
    supabase.from('agents').select('id, display_name, status').eq('customer_id', customerId).limit(20),
    supabase.from('suggestions').select('title, risk_score, risk_category, objective, proposed_action, status, generated_at')
      .eq('customer_id', customerId).order('generated_at', { ascending: false }).limit(15),
    supabase.from('policies').select('rule_id, name, action, enabled, agent_id').eq('customer_id', customerId).limit(20),
  ]);
  return {
    agents: agentsR.data ?? [],
    recent_suggestions: suggR.data ?? [],
    policies: polR.data ?? [],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: corsHeaders });
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI gateway not configured' }), {
      status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  // Auth: bearer = user JWT from supabase client.
  const authHeader = req.headers.get('authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  let body: { messages?: ChatMessage[] } = {};
  try { body = await req.json(); } catch { /* noop */ }
  const history = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (history.length === 0) {
    return new Response(JSON.stringify({ error: 'no messages' }), {
      status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  const context = await buildContext(supabase, user.id);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `CONTEXT (current tenant snapshot):\n${JSON.stringify(context, null, 2)}` },
    ...history.map((m) => ({ role: m.role, content: String(m.content ?? '').slice(0, 8000) })),
  ];

  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.4 }),
    });
    if (r.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit — wait a moment.' }), {
        status: 429, headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits in workspace settings.' }), {
        status: 402, headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }
    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${txt.slice(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }
    const data = await r.json();
    const reply: string = data?.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ reply, model: MODEL }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
