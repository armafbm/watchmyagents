import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "arma@watchmyagents.com";

function requireAdmin(claims: Record<string, unknown>) {
  if (claims.email !== ADMIN_EMAIL) throw new Error("Forbidden");
}

// ─── METRICS ────────────────────────────────────────────────────────────────

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

// ─── USERS ──────────────────────────────────────────────────────────────────

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

    const [agentRes, decisionRes, keyRes] = await Promise.all([
      supabaseAdmin.from("agents").select("customer_id, last_seen_at").in("customer_id", ids),
      supabaseAdmin.from("decisions").select("customer_id").in("customer_id", ids).gte("decided_at", since30d),
      supabaseAdmin.from("api_keys").select("customer_id, last_used_at").in("customer_id", ids).is("revoked_at", null),
    ]);

    const agentMap: Record<string, number> = {};
    const lastActiveMap: Record<string, string> = {};
    for (const a of agentRes.data ?? []) {
      agentMap[a.customer_id] = (agentMap[a.customer_id] ?? 0) + 1;
      if (a.last_seen_at) {
        if (!lastActiveMap[a.customer_id] || a.last_seen_at > lastActiveMap[a.customer_id])
          lastActiveMap[a.customer_id] = a.last_seen_at;
      }
    }

    const decisionMap: Record<string, number> = {};
    for (const d of decisionRes.data ?? []) decisionMap[d.customer_id] = (decisionMap[d.customer_id] ?? 0) + 1;

    const keyMap: Record<string, number> = {};
    for (const k of keyRes.data ?? []) {
      keyMap[k.customer_id] = (keyMap[k.customer_id] ?? 0) + 1;
      if (k.last_used_at) {
        if (!lastActiveMap[k.customer_id] || k.last_used_at > lastActiveMap[k.customer_id])
          lastActiveMap[k.customer_id] = k.last_used_at;
      }
    }

    return customers.map((c) => ({
      id: c.id,
      email: c.email,
      display_name: c.display_name,
      plan: c.plan,
      created_at: c.created_at,
      agent_count: agentMap[c.id] ?? 0,
      decisions_30d: decisionMap[c.id] ?? 0,
      active_keys: keyMap[c.id] ?? 0,
      last_active: lastActiveMap[c.id] ?? null,
    })) satisfies AdminUser[];
  });

export const updateUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { customerId: string; plan: string }) => data)
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

// ─── OPERATOR — API KEYS ────────────────────────────────────────────────────

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
    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id, email")
      .in("id", customerIds);

    const emailMap: Record<string, string> = {};
    for (const c of customers ?? []) emailMap[c.id] = c.email;

    return keys.map((k) => ({
      ...k,
      scopes: (k.scopes as string[]) ?? [],
      customer_email: emailMap[k.customer_id] ?? "—",
    })) satisfies AdminApiKey[];
  });

export const revokeAdminApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { keyId: string }) => data)
  .handler(async ({ context, data }) => {
    requireAdmin(context.claims);
    const { error } = await supabaseAdmin
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.keyId);
    if (error) throw error;
    return { ok: true };
  });

// ─── SIGNING KEYS ───────────────────────────────────────────────────────────

export type AdminSigningKey = {
  kid: string;
  pubkey: string;
  valid_from: string;
  valid_until: string;
  signed_by_root: string;
  revoked_at: string | null;
};

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
    const { error } = await supabaseAdmin
      .from("signing_keys_public")
      .update({ revoked_at: new Date().toISOString() })
      .eq("kid", data.kid);
    if (error) throw error;
    return { ok: true };
  });
