import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "arma@watchmyagents.com";

function requireAdmin(claims: Record<string, unknown>) {
  if (claims.email !== ADMIN_EMAIL) throw new Error("Forbidden");
}

// ─── HEALTH UTILS ─────────────────────────────────────────────────────────────

export function computeAgentHealth(last_seen_at: string | null): {
  health: "healthy" | "warning" | "critical";
  score: number;
} {
  if (!last_seen_at) return { health: "critical", score: 10 };
  const h = (Date.now() - new Date(last_seen_at).getTime()) / 3_600_000;
  if (h < 1) return { health: "healthy", score: 100 };
  if (h < 6) return { health: "healthy", score: 92 };
  if (h < 24) return { health: "warning", score: 72 };
  if (h < 72) return { health: "warning", score: 50 };
  if (h < 168) return { health: "critical", score: 25 };
  return { health: "critical", score: 8 };
}

const PLAN_MRR: Record<string, number> = { free: 0, pro: 49, pro_plus: 99, business: 299, advanced: 999 };
const COST_PER_DECISION = 0.0015;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AdminMetrics = {
  total_customers: number;
  total_agents: number;
  total_decisions: number;
  active_keys: number;
  plan_breakdown: Record<string, number>;
  agents_healthy: number;
  agents_warning: number;
  agents_critical: number;
  global_health_score: number;
  mrr_estimate: number;
  cost_estimate_today: number;
};

export type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  created_at: string;
  agent_count: number;
  decisions_30d: number;
  active_keys: number;
  last_active: string | null;
};

export type CustomerHealth = {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  created_at: string;
  health_score: number;
  health: "healthy" | "warning" | "critical";
  agent_count: number;
  agents_healthy: number;
  agents_warning: number;
  agents_critical: number;
  decisions_7d: number;
  decisions_30d: number;
  active_keys: number;
  policy_count: number;
  last_active: string | null;
  cost_estimate_usd: number;
  mrr_usd: number;
  margin_pct: number;
};

export type AdminAgent = {
  id: string;
  customer_id: string;
  customer_email: string;
  display_name: string | null;
  native_agent_id: string;
  provider: string;
  status: string;
  last_seen_at: string | null;
  agent_type: string | null;
  decisions_total: number;
  decisions_7d: number;
  allow_count: number;
  deny_count: number;
  interrupt_count: number;
  policy_count: number;
  health: "healthy" | "warning" | "critical";
  health_score: number;
};

export type GuardianStats = {
  decisions_total: number;
  decisions_today: number;
  decisions_7d: number;
  allow_total: number;
  deny_total: number;
  interrupt_total: number;
  enforcement_delivered: number;
  enforcement_rate_pct: number;
  active_policies: number;
  total_policies: number;
  agents_with_policies: number;
  agents_without_policies: number;
  deny_rate_pct: number;
};

export type AlertEvent = {
  id: string;
  type: "agent_offline" | "deny_spike" | "interrupt" | "no_enforcement" | "key_inactive";
  severity: "critical" | "high" | "medium";
  title: string;
  detail: string;
  customer_email: string;
  agent_name: string | null;
  ts: string;
};

export type CostEntry = {
  customer_id: string;
  customer_email: string;
  plan: string;
  decisions_30d: number;
  estimated_tokens: number;
  estimated_cost_usd: number;
  mrr_usd: number;
  margin_pct: number;
  risk: "low" | "medium" | "high";
};

export type CustomerScore = {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  engagement_score: number;
  value_score: number;
  risk_score: number;
  overall: "healthy" | "attention" | "critical";
  risk_reason: string;
};

export type AdminApiKey = {
  id: string;
  customer_id: string;
  customer_email: string;
  label: string;
  prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type AdminSigningKey = {
  kid: string;
  pubkey: string;
  valid_from: string;
  valid_until: string;
  signed_by_root: string;
  revoked_at: string | null;
};

// ─── MISSION CONTROL ──────────────────────────────────────────────────────────

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [customersRes, agentsRes, decisionsRes, keysRes, decTodayRes] = await Promise.all([
      supabaseAdmin.from("customers").select("id, plan", { count: "exact" }),
      supabaseAdmin.from("agents").select("id, last_seen_at", { count: "exact" }),
      supabaseAdmin.from("decisions").select("id", { count: "exact" }),
      supabaseAdmin.from("api_keys").select("id", { count: "exact" }).is("revoked_at", null),
      supabaseAdmin.from("decisions").select("id", { count: "exact" }).gte("decided_at", today.toISOString()),
    ]);

    const planBreakdown: Record<string, number> = {};
    let mrr = 0;
    for (const c of customersRes.data ?? []) {
      planBreakdown[c.plan] = (planBreakdown[c.plan] ?? 0) + 1;
      mrr += PLAN_MRR[c.plan] ?? 0;
    }

    let healthy = 0, warning = 0, critical = 0;
    for (const a of agentsRes.data ?? []) {
      const h = computeAgentHealth(a.last_seen_at).health;
      if (h === "healthy") healthy++;
      else if (h === "warning") warning++;
      else critical++;
    }
    const total = Math.max(agentsRes.count ?? 0, 1);
    const globalScore = Math.round((healthy * 100 + warning * 70 + critical * 20) / total);

    return {
      total_customers: customersRes.count ?? 0,
      total_agents: agentsRes.count ?? 0,
      total_decisions: decisionsRes.count ?? 0,
      active_keys: keysRes.count ?? 0,
      plan_breakdown: planBreakdown,
      agents_healthy: healthy,
      agents_warning: warning,
      agents_critical: critical,
      global_health_score: globalScore,
      mrr_estimate: mrr,
      cost_estimate_today: (decTodayRes.count ?? 0) * COST_PER_DECISION,
    } satisfies AdminMetrics;
  });

// ─── ALERTS ───────────────────────────────────────────────────────────────────

export const getAdminAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const since24h = new Date(Date.now() - 86_400_000).toISOString();
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [offlineAgents, recentDenies, interrupts] = await Promise.all([
      supabaseAdmin
        .from("agents")
        .select("id, display_name, native_agent_id, last_seen_at, customer_id, customers!inner(email)")
        .lt("last_seen_at", since24h)
        .eq("status", "active")
        .order("last_seen_at", { ascending: true })
        .limit(8),
      supabaseAdmin
        .from("decisions")
        .select("id, decided_at, message, agent_id, customer_id, agents!inner(display_name, native_agent_id), customers!inner(email)")
        .eq("decision", "deny")
        .gte("decided_at", since24h)
        .order("decided_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("decisions")
        .select("id, decided_at, message, agent_id, customer_id, agents!inner(display_name, native_agent_id), customers!inner(email)")
        .eq("decision", "interrupt")
        .gte("decided_at", since24h)
        .order("decided_at", { ascending: false })
        .limit(4),
    ]);

    const alerts: AlertEvent[] = [];

    for (const a of offlineAgents.data ?? []) {
      const hoursAgo = Math.round((Date.now() - new Date(a.last_seen_at!).getTime()) / 3_600_000);
      alerts.push({
        id: `offline-${a.id}`,
        type: "agent_offline",
        severity: hoursAgo > 72 ? "critical" : "high",
        title: `Agent offline — ${a.display_name ?? a.native_agent_id}`,
        detail: `Aucun signal depuis ${hoursAgo}h`,
        customer_email: (a as any).customers?.email ?? "—",
        agent_name: a.display_name ?? a.native_agent_id,
        ts: a.last_seen_at!,
      });
    }

    for (const d of recentDenies.data ?? []) {
      const agentName = (d as any).agents?.display_name ?? (d as any).agents?.native_agent_id ?? "agent";
      alerts.push({
        id: `deny-${d.id}`,
        type: "deny_spike",
        severity: "high",
        title: `DENY — ${agentName}`,
        detail: d.message?.slice(0, 80) ?? "Action bloquée par Guardian",
        customer_email: (d as any).customers?.email ?? "—",
        agent_name: agentName,
        ts: d.decided_at,
      });
    }

    for (const i of interrupts.data ?? []) {
      const agentName = (i as any).agents?.display_name ?? "agent";
      alerts.push({
        id: `interrupt-${i.id}`,
        type: "interrupt",
        severity: "medium",
        title: `INTERRUPT — ${agentName}`,
        detail: i.message?.slice(0, 80) ?? "Guardian a interrompu l'agent",
        customer_email: (i as any).customers?.email ?? "—",
        agent_name: agentName,
        ts: i.decided_at,
      });
    }

    const SORD: Record<string, number> = { critical: 0, high: 1, medium: 2 };
    alerts.sort((a, b) => {
      const sv = SORD[a.severity] - SORD[b.severity];
      return sv !== 0 ? sv : new Date(b.ts).getTime() - new Date(a.ts).getTime();
    });

    return alerts.slice(0, 20);
  });

// ─── HEALTH CENTER ────────────────────────────────────────────────────────────

export const getAdminHealthCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id, email, display_name, plan, created_at")
      .order("created_at", { ascending: false });

    if (!customers?.length) return [] as CustomerHealth[];

    const ids = customers.map((c) => c.id);
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [agentRes, dec7dRes, dec30dRes, keyRes, policyRes] = await Promise.all([
      supabaseAdmin.from("agents").select("customer_id, last_seen_at").in("customer_id", ids),
      supabaseAdmin.from("decisions").select("customer_id").in("customer_id", ids).gte("decided_at", since7d),
      supabaseAdmin.from("decisions").select("customer_id").in("customer_id", ids).gte("decided_at", since30d),
      supabaseAdmin.from("api_keys").select("customer_id, last_used_at").in("customer_id", ids).is("revoked_at", null),
      supabaseAdmin.from("policies").select("customer_id").in("customer_id", ids).eq("enabled", true),
    ]);

    const agentMap: Record<string, Array<{ last_seen_at: string | null }>> = {};
    const lastActiveMap: Record<string, string> = {};
    for (const a of agentRes.data ?? []) {
      if (!agentMap[a.customer_id]) agentMap[a.customer_id] = [];
      agentMap[a.customer_id].push({ last_seen_at: a.last_seen_at });
      if (a.last_seen_at && (!lastActiveMap[a.customer_id] || a.last_seen_at > lastActiveMap[a.customer_id]))
        lastActiveMap[a.customer_id] = a.last_seen_at;
    }

    const dec7dMap: Record<string, number> = {};
    for (const d of dec7dRes.data ?? []) dec7dMap[d.customer_id] = (dec7dMap[d.customer_id] ?? 0) + 1;

    const dec30dMap: Record<string, number> = {};
    for (const d of dec30dRes.data ?? []) dec30dMap[d.customer_id] = (dec30dMap[d.customer_id] ?? 0) + 1;

    const keyMap: Record<string, number> = {};
    for (const k of keyRes.data ?? []) {
      keyMap[k.customer_id] = (keyMap[k.customer_id] ?? 0) + 1;
      if (k.last_used_at && (!lastActiveMap[k.customer_id] || k.last_used_at > lastActiveMap[k.customer_id]))
        lastActiveMap[k.customer_id] = k.last_used_at;
    }

    const policyMap: Record<string, number> = {};
    for (const p of policyRes.data ?? []) policyMap[p.customer_id] = (policyMap[p.customer_id] ?? 0) + 1;

    return customers.map((c) => {
      const agents = agentMap[c.id] ?? [];
      const d7d = dec7dMap[c.id] ?? 0;
      const d30d = dec30dMap[c.id] ?? 0;

      let h_count = 0, w_count = 0, cr_count = 0;
      for (const a of agents) {
        const h = computeAgentHealth(a.last_seen_at).health;
        if (h === "healthy") h_count++;
        else if (h === "warning") w_count++;
        else cr_count++;
      }

      let score = 25;
      if (agents.length > 0) {
        const avg = agents.map((a) => computeAgentHealth(a.last_seen_at).score).reduce((a, b) => a + b, 0) / agents.length;
        score = avg * 0.6;
        if ((keyMap[c.id] ?? 0) > 0) score += 10;
        if (d7d > 0) score += 15;
        if ((policyMap[c.id] ?? 0) > 0) score += 15;
      }
      score = Math.min(100, Math.round(score));

      const health: "healthy" | "warning" | "critical" = score >= 75 ? "healthy" : score >= 45 ? "warning" : "critical";
      const cost = d30d * COST_PER_DECISION;
      const mrr = PLAN_MRR[c.plan] ?? 0;
      const margin = mrr > 0 ? Math.max(0, Math.min(100, Math.round(((mrr - cost) / mrr) * 100))) : 0;

      return {
        id: c.id,
        email: c.email,
        display_name: c.display_name,
        plan: c.plan,
        created_at: c.created_at,
        health_score: score,
        health,
        agent_count: agents.length,
        agents_healthy: h_count,
        agents_warning: w_count,
        agents_critical: cr_count,
        decisions_7d: d7d,
        decisions_30d: d30d,
        active_keys: keyMap[c.id] ?? 0,
        policy_count: policyMap[c.id] ?? 0,
        last_active: lastActiveMap[c.id] ?? null,
        cost_estimate_usd: cost,
        mrr_usd: mrr,
        margin_pct: margin,
      } satisfies CustomerHealth;
    });
  });

// ─── AGENT MONITOR ────────────────────────────────────────────────────────────

export const getAdminAgentMonitor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const { data: agents } = await supabaseAdmin
      .from("agents")
      .select("id, customer_id, display_name, native_agent_id, provider, status, last_seen_at, agent_type")
      .order("last_seen_at", { ascending: false, nullsFirst: false });

    if (!agents?.length) return [] as AdminAgent[];

    const customerIds = [...new Set(agents.map((a) => a.customer_id))];
    const agentIds = agents.map((a) => a.id);
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [custRes, decAllRes, dec7dRes, decBreakRes, policyRes] = await Promise.all([
      supabaseAdmin.from("customers").select("id, email").in("id", customerIds),
      supabaseAdmin.from("decisions").select("agent_id").in("agent_id", agentIds),
      supabaseAdmin.from("decisions").select("agent_id").in("agent_id", agentIds).gte("decided_at", since7d),
      supabaseAdmin.from("decisions").select("agent_id, decision").in("agent_id", agentIds),
      supabaseAdmin.from("policies").select("agent_id, customer_id").eq("enabled", true).in("customer_id", customerIds),
    ]);

    const emailMap: Record<string, string> = {};
    for (const c of custRes.data ?? []) emailMap[c.id] = c.email;

    const decTotalMap: Record<string, number> = {};
    for (const d of decAllRes.data ?? []) decTotalMap[d.agent_id] = (decTotalMap[d.agent_id] ?? 0) + 1;

    const dec7dMap: Record<string, number> = {};
    for (const d of dec7dRes.data ?? []) dec7dMap[d.agent_id] = (dec7dMap[d.agent_id] ?? 0) + 1;

    const allowMap: Record<string, number> = {};
    const denyMap: Record<string, number> = {};
    const interruptMap: Record<string, number> = {};
    for (const d of decBreakRes.data ?? []) {
      if (d.decision === "allow") allowMap[d.agent_id] = (allowMap[d.agent_id] ?? 0) + 1;
      else if (d.decision === "deny") denyMap[d.agent_id] = (denyMap[d.agent_id] ?? 0) + 1;
      else if (d.decision === "interrupt") interruptMap[d.agent_id] = (interruptMap[d.agent_id] ?? 0) + 1;
    }

    const policyMap: Record<string, number> = {};
    for (const p of policyRes.data ?? []) {
      if (p.agent_id) policyMap[p.agent_id] = (policyMap[p.agent_id] ?? 0) + 1;
      else policyMap[`cust-${p.customer_id}`] = (policyMap[`cust-${p.customer_id}`] ?? 0) + 1;
    }

    return agents.map((a) => {
      const { health, score } = computeAgentHealth(a.last_seen_at);
      return {
        id: a.id,
        customer_id: a.customer_id,
        customer_email: emailMap[a.customer_id] ?? "—",
        display_name: a.display_name,
        native_agent_id: a.native_agent_id,
        provider: a.provider ?? "anthropic-managed",
        status: a.status ?? "active",
        last_seen_at: a.last_seen_at,
        agent_type: a.agent_type,
        decisions_total: decTotalMap[a.id] ?? 0,
        decisions_7d: dec7dMap[a.id] ?? 0,
        allow_count: allowMap[a.id] ?? 0,
        deny_count: denyMap[a.id] ?? 0,
        interrupt_count: interruptMap[a.id] ?? 0,
        policy_count: (policyMap[a.id] ?? 0) + (policyMap[`cust-${a.customer_id}`] ?? 0),
        health,
        health_score: score,
      } satisfies AdminAgent;
    });
  });

// ─── GUARDIAN STATS ───────────────────────────────────────────────────────────

export const getAdminGuardianStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [allDec, todayDec, dec7d, policyAll, policyActive, custWithPolicy, totalCust] = await Promise.all([
      supabaseAdmin.from("decisions").select("decision, mode"),
      supabaseAdmin.from("decisions").select("id", { count: "exact" }).gte("decided_at", today.toISOString()),
      supabaseAdmin.from("decisions").select("id", { count: "exact" }).gte("decided_at", since7d),
      supabaseAdmin.from("policies").select("id", { count: "exact" }),
      supabaseAdmin.from("policies").select("id", { count: "exact" }).eq("enabled", true),
      supabaseAdmin.from("policies").select("customer_id").eq("enabled", true),
      supabaseAdmin.from("customers").select("id", { count: "exact" }),
    ]);

    const all = allDec.data ?? [];
    let allow = 0, deny = 0, interrupt = 0, enforceMode = 0;
    for (const d of all) {
      if (d.decision === "allow") allow++;
      else if (d.decision === "deny") deny++;
      else if (d.decision === "interrupt") interrupt++;
      if (d.mode === "enforce") enforceMode++;
    }

    const custWithPolicies = new Set((custWithPolicy.data ?? []).map((p) => p.customer_id));
    const total = all.length || 1;

    return {
      decisions_total: all.length,
      decisions_today: todayDec.count ?? 0,
      decisions_7d: dec7d.count ?? 0,
      allow_total: allow,
      deny_total: deny,
      interrupt_total: interrupt,
      enforcement_delivered: 0,
      enforcement_rate_pct: 0,
      active_policies: policyActive.count ?? 0,
      total_policies: policyAll.count ?? 0,
      agents_with_policies: custWithPolicies.size,
      agents_without_policies: Math.max(0, (totalCust.count ?? 0) - custWithPolicies.size),
      deny_rate_pct: Math.round((deny / total) * 100),
    } satisfies GuardianStats;
  });

// ─── COST CENTER ──────────────────────────────────────────────────────────────

export const getAdminCostCenter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { data: customers } = await supabaseAdmin.from("customers").select("id, email, plan").order("email");

    if (!customers?.length) return [] as CostEntry[];

    const ids = customers.map((c) => c.id);
    const { data: decisions } = await supabaseAdmin
      .from("decisions")
      .select("customer_id")
      .in("customer_id", ids)
      .gte("decided_at", since30d);

    const decMap: Record<string, number> = {};
    for (const d of decisions ?? []) decMap[d.customer_id] = (decMap[d.customer_id] ?? 0) + 1;

    return customers.map((c): CostEntry => {
      const d30d = decMap[c.id] ?? 0;
      const cost = d30d * COST_PER_DECISION;
      const mrr = PLAN_MRR[c.plan] ?? 0;
      const margin = mrr > 0 ? Math.max(0, Math.min(100, Math.round(((mrr - cost) / mrr) * 100))) : 0;
      const risk: "low" | "medium" | "high" = mrr > 0 && cost > mrr * 0.5 ? "high" : cost > mrr * 0.2 ? "medium" : "low";
      return {
        customer_id: c.id,
        customer_email: c.email,
        plan: c.plan,
        decisions_30d: d30d,
        estimated_tokens: d30d * 500,
        estimated_cost_usd: cost,
        mrr_usd: mrr,
        margin_pct: margin,
        risk,
      };
    });
  });

// ─── CLIENT SCORING ───────────────────────────────────────────────────────────

export const getAdminCustomerScores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id, email, display_name, plan, created_at");

    if (!customers?.length) return [] as CustomerScore[];

    const ids = customers.map((c) => c.id);
    const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [agentsRes, dec7d, dec30d, keysRes, policiesRes] = await Promise.all([
      supabaseAdmin.from("agents").select("customer_id, last_seen_at").in("customer_id", ids),
      supabaseAdmin.from("decisions").select("customer_id").in("customer_id", ids).gte("decided_at", since7d),
      supabaseAdmin.from("decisions").select("customer_id").in("customer_id", ids).gte("decided_at", since30d),
      supabaseAdmin.from("api_keys").select("customer_id").in("customer_id", ids).is("revoked_at", null),
      supabaseAdmin.from("policies").select("customer_id").in("customer_id", ids).eq("enabled", true),
    ]);

    const agentMap: Record<string, Array<{ last_seen_at: string | null }>> = {};
    for (const a of agentsRes.data ?? []) {
      if (!agentMap[a.customer_id]) agentMap[a.customer_id] = [];
      agentMap[a.customer_id].push(a);
    }
    const dec7dMap: Record<string, number> = {};
    for (const d of dec7d.data ?? []) dec7dMap[d.customer_id] = (dec7dMap[d.customer_id] ?? 0) + 1;
    const dec30dMap: Record<string, number> = {};
    for (const d of dec30d.data ?? []) dec30dMap[d.customer_id] = (dec30dMap[d.customer_id] ?? 0) + 1;
    const keySet: Set<string> = new Set((keysRes.data ?? []).map((k) => k.customer_id));
    const policySet: Set<string> = new Set((policiesRes.data ?? []).map((p) => p.customer_id));

    const PLAN_WEIGHT: Record<string, number> = { free: 5, pro: 35, pro_plus: 55, business: 75, advanced: 95 };

    return customers.map((c): CustomerScore => {
      const agents = agentMap[c.id] ?? [];
      const activeAgents = agents.filter((a) => computeAgentHealth(a.last_seen_at).health === "healthy").length;
      const d7d = dec7dMap[c.id] ?? 0;
      const d30d = dec30dMap[c.id] ?? 0;
      const hasKeys = keySet.has(c.id);
      const hasPolicies = policySet.has(c.id);
      const ageDays = (Date.now() - new Date(c.created_at).getTime()) / 86_400_000;

      let engagement = 0;
      if (agents.length > 0) engagement += 25;
      if (activeAgents > 0) engagement += 25;
      if (d7d > 0) engagement += 25;
      if (hasKeys && hasPolicies) engagement += 25;
      else if (hasKeys || hasPolicies) engagement += 12;

      let value = PLAN_WEIGHT[c.plan] ?? 20;
      if (d30d > 100) value = Math.min(100, value + 15);
      else if (d30d > 10) value = Math.min(100, value + 7);

      let risk = 0;
      if (d7d === 0 && d30d === 0 && ageDays > 7) risk += 40;
      else if (d7d === 0) risk += 20;
      if (agents.length === 0) risk += 20;
      if (!hasKeys) risk += 15;
      if (!hasPolicies) risk += 15;
      if (agents.length > 0 && activeAgents === 0) risk += 20;
      risk = Math.min(100, risk);

      const reasons: string[] = [];
      if (d7d === 0 && ageDays > 7) reasons.push("Inactif 7j");
      if (!hasKeys) reasons.push("Aucune clé API");
      if (!hasPolicies) reasons.push("Aucune politique");
      if (agents.length > 0 && activeAgents === 0) reasons.push("Agents hors-ligne");

      const overall: "healthy" | "attention" | "critical" =
        risk >= 60 ? "critical" : risk >= 30 || engagement < 40 ? "attention" : "healthy";

      return { id: c.id, email: c.email, display_name: c.display_name, plan: c.plan, engagement_score: engagement, value_score: value, risk_score: risk, overall, risk_reason: reasons.join(", ") || "Aucun risque détecté" };
    });
  });

// ─── USERS / PLANS ────────────────────────────────────────────────────────────

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id, email, display_name, plan, created_at")
      .order("created_at", { ascending: false });

    if (!customers?.length) return [] as AdminUser[];

    const ids = customers.map((c) => c.id);
    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [agentRes, decisionRes, keyRes] = await Promise.all([
      supabaseAdmin.from("agents").select("customer_id, last_seen_at").in("customer_id", ids),
      supabaseAdmin.from("decisions").select("customer_id").in("customer_id", ids).gte("decided_at", since30d),
      supabaseAdmin.from("api_keys").select("customer_id, last_used_at").in("customer_id", ids).is("revoked_at", null),
    ]);

    const agentMap: Record<string, number> = {};
    const lastActiveMap: Record<string, string> = {};
    for (const a of agentRes.data ?? []) {
      agentMap[a.customer_id] = (agentMap[a.customer_id] ?? 0) + 1;
      if (a.last_seen_at && (!lastActiveMap[a.customer_id] || a.last_seen_at > lastActiveMap[a.customer_id]))
        lastActiveMap[a.customer_id] = a.last_seen_at;
    }

    const decisionMap: Record<string, number> = {};
    for (const d of decisionRes.data ?? []) decisionMap[d.customer_id] = (decisionMap[d.customer_id] ?? 0) + 1;

    const keyMap: Record<string, number> = {};
    for (const k of keyRes.data ?? []) {
      keyMap[k.customer_id] = (keyMap[k.customer_id] ?? 0) + 1;
      if (k.last_used_at && (!lastActiveMap[k.customer_id] || k.last_used_at > lastActiveMap[k.customer_id]))
        lastActiveMap[k.customer_id] = k.last_used_at;
    }

    return customers.map((c) => ({
      id: c.id, email: c.email, display_name: c.display_name, plan: c.plan, created_at: c.created_at,
      agent_count: agentMap[c.id] ?? 0, decisions_30d: decisionMap[c.id] ?? 0,
      active_keys: keyMap[c.id] ?? 0, last_active: lastActiveMap[c.id] ?? null,
    })) satisfies AdminUser[];
  });

export const updateUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { customerId: string; plan: string }) => data)
  .handler(async ({ context, data }) => {
    requireAdmin(context.claims);
    const VALID_PLANS = ["free", "pro", "pro_plus", "business", "advanced"];
    if (!VALID_PLANS.includes(data.plan)) throw new Error("Invalid plan");
    const { error } = await supabaseAdmin.from("customers").update({ plan: data.plan }).eq("id", data.customerId);
    if (error) throw error;
    return { ok: true };
  });

// ─── API KEYS ─────────────────────────────────────────────────────────────────

export const getAdminApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const { data: keys } = await supabaseAdmin
      .from("api_keys")
      .select("id, customer_id, label, prefix, scopes, created_at, last_used_at, revoked_at")
      .order("created_at", { ascending: false });

    if (!keys?.length) return [] as AdminApiKey[];

    const customerIds = [...new Set(keys.map((k) => k.customer_id))];
    const { data: customers } = await supabaseAdmin.from("customers").select("id, email").in("id", customerIds);
    const emailMap: Record<string, string> = {};
    for (const c of customers ?? []) emailMap[c.id] = c.email;

    return keys.map((k) => ({ ...k, scopes: (k.scopes as string[]) ?? [], customer_email: emailMap[k.customer_id] ?? "—" })) satisfies AdminApiKey[];
  });

export const revokeAdminApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { keyId: string }) => data)
  .handler(async ({ context, data }) => {
    requireAdmin(context.claims);
    const { error } = await supabaseAdmin.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", data.keyId);
    if (error) throw error;
    return { ok: true };
  });

// ─── SIGNING KEYS ─────────────────────────────────────────────────────────────

export const getAdminSigningKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);
    const { data } = await supabaseAdmin
      .from("signing_keys_public")
      .select("kid, pubkey, valid_from, valid_until, signed_by_root, revoked_at")
      .order("valid_from", { ascending: false });
    return (data ?? []) as AdminSigningKey[];
  });

export const revokeAdminSigningKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kid: string }) => data)
  .handler(async ({ context, data }) => {
    requireAdmin(context.claims);
    const { error } = await supabaseAdmin.from("signing_keys_public").update({ revoked_at: new Date().toISOString() }).eq("kid", data.kid);
    if (error) throw error;
    return { ok: true };
  });
