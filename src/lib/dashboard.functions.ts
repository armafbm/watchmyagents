import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TodayRow = {
  agents_active: number | null;
  tokens_24h: number | null;
  actions_24h: number | null;
  blocked_24h: number | null;
  suggestions_pending: number | null;
};

export type Decision = {
  id: string;
  decided_at: string;
  decision: string;
  tool_name: string | null;
  message: string | null;
};

export type AgentRow = {
  id: string;
  display_name: string;
  status: string;
  provider: string;
  last_seen_at: string | null;
};

export const getDashboardSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [todayRes, decisionsRes, agentsRes] = await Promise.all([
      supabase.from("dashboard_today_v").select("*").eq("customer_id", userId).maybeSingle(),
      supabase
        .from("decisions")
        .select("id,decided_at,decision,tool_name,message")
        .eq("customer_id", userId)
        .order("decided_at", { ascending: false })
        .limit(8),
      supabase
        .from("agents")
        .select("id,display_name,status,provider,last_seen_at")
        .eq("customer_id", userId)
        .order("last_seen_at", { ascending: false, nullsFirst: false })
        .limit(20),
    ]);

    const firstErr = todayRes.error ?? decisionsRes.error ?? agentsRes.error;
    if (firstErr) throw new Error(firstErr.message);

    return {
      today:
        (todayRes.data as TodayRow | null) ?? {
          agents_active: 0,
          tokens_24h: 0,
          actions_24h: 0,
          blocked_24h: 0,
          suggestions_pending: 0,
        },
      decisions: (decisionsRes.data as Decision[] | null) ?? [],
      agents: (agentsRes.data as AgentRow[] | null) ?? [],
    };
  });

export const getDashboardSidebarState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [agentsRes, suggestionsRes] = await Promise.all([
      supabase.from("agents").select("id,status").eq("customer_id", userId),
      supabase
        .from("suggestions")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", userId)
        .eq("status", "pending"),
    ]);

    const firstErr = agentsRes.error ?? suggestionsRes.error;
    if (firstErr) throw new Error(firstErr.message);

    const agentRows = agentsRes.data ?? [];
    const total = agentRows.length;
    const active = agentRows.filter((agent) => agent.status === "active").length;
    const shield = suggestionsRes.count ?? 0;

    return {
      fleet: { total, active },
      notifications: { shield, total: shield },
    };
  });