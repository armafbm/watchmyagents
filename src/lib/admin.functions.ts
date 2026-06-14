import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "arma@watchmyagents.com";

function requireAdmin(claims: Record<string, unknown>) {
  if (claims.email !== ADMIN_EMAIL) throw new Error("Forbidden");
}

export type AdminMetrics = {
  total_customers: number;
  total_agents: number;
  total_decisions: number;
  active_keys: number;
  plan_breakdown: Record<string, number>;
};

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const [customersRes, agentsRes, decisionsRes, keysRes] = await Promise.all([
      supabaseAdmin.from("customers").select("id, plan", { count: "exact" }),
      supabaseAdmin.from("agents").select("id", { count: "exact" }),
      supabaseAdmin.from("decisions").select("id", { count: "exact" }),
      supabaseAdmin.from("api_keys").select("id", { count: "exact" }).is("revoked_at", null),
    ]);

    const planBreakdown: Record<string, number> = {};
    for (const c of customersRes.data ?? []) {
      planBreakdown[c.plan] = (planBreakdown[c.plan] ?? 0) + 1;
    }

    return {
      total_customers: customersRes.count ?? 0,
      total_agents: agentsRes.count ?? 0,
      total_decisions: decisionsRes.count ?? 0,
      active_keys: keysRes.count ?? 0,
      plan_breakdown: planBreakdown,
    } satisfies AdminMetrics;
  });

export type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  plan: string;
  created_at: string;
  agent_count: number;
  decisions_30d: number;
};

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    requireAdmin(context.claims);

    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id, email, display_name, plan, created_at")
      .order("created_at", { ascending: false });

    if (!customers || customers.length === 0) return [] as AdminUser[];

    const ids = customers.map((c) => c.id);
    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [agentRes, decisionRes] = await Promise.all([
      supabaseAdmin.from("agents").select("customer_id").in("customer_id", ids),
      supabaseAdmin.from("decisions").select("customer_id").in("customer_id", ids).gte("decided_at", since30d),
    ]);

    const agentMap: Record<string, number> = {};
    for (const a of agentRes.data ?? []) agentMap[a.customer_id] = (agentMap[a.customer_id] ?? 0) + 1;

    const decisionMap: Record<string, number> = {};
    for (const d of decisionRes.data ?? []) decisionMap[d.customer_id] = (decisionMap[d.customer_id] ?? 0) + 1;

    return customers.map((c) => ({
      id: c.id,
      email: c.email,
      display_name: c.display_name,
      plan: c.plan,
      created_at: c.created_at,
      agent_count: agentMap[c.id] ?? 0,
      decisions_30d: decisionMap[c.id] ?? 0,
    })) satisfies AdminUser[];
  });

export const updateUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => data as { customerId: string; plan: string })
  .handler(async ({ context, data }) => {
    requireAdmin(context.claims);

    const VALID_PLANS = ["free", "pro", "pro_plus", "business", "advanced"];
    if (!VALID_PLANS.includes(data.plan)) throw new Error("Invalid plan");

    const { error } = await supabaseAdmin
      .from("customers")
      .update({ plan: data.plan })
      .eq("id", data.customerId);

    if (error) throw error;
    return { ok: true };
  });
