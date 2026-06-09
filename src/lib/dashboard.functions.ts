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

    // Only throw if ALL three fail simultaneously (total blackout).
    // A single section failing returns its safe default so the rest of the dashboard stays visible.
    if (todayRes.error && decisionsRes.error && agentsRes.error) {
      throw new Error(todayRes.error.message);
    }

    return {
      today: (todayRes.data as TodayRow | null) ?? {
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

    const [totalRes, activeRes, suggestionsRes] = await Promise.all([
      supabase
        .from("agents")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", userId),
      supabase
        .from("agents")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", userId)
        .eq("status", "active"),
      supabase
        .from("suggestions")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", userId)
        .eq("status", "pending"),
    ]);

    const firstErr = totalRes.error ?? activeRes.error ?? suggestionsRes.error;
    if (firstErr) throw new Error(firstErr.message);

    const shield = suggestionsRes.count ?? 0;

    return {
      fleet: { total: totalRes.count ?? 0, active: activeRes.count ?? 0 },
      notifications: { shield, total: shield },
    };
  });

export type LegionRow = {
  agent_id: string | null;
  display_name: string | null;
  signals_7d: number | null;
  suggestions_7d: number | null;
  suggestions_accepted_7d: number | null;
  decisions_7d: number | null;
  enforcements_7d: number | null;
};

export const getLegionsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("loop_overview_v")
      .select("*")
      .eq("customer_id", userId)
      .order("enforcements_7d", { ascending: false });

    if (error) throw new Error(error.message);

    return (data as LegionRow[] | null) ?? [];
  });

// ----------------------------------------------------------------
// Fleet management data
// ----------------------------------------------------------------
export type FleetLegion = {
  id: string;
  name: string;
  description: string | null;
  color: string;
};

export type FleetAgent = {
  id: string;
  display_name: string;
  status: string;
  provider: string;
  last_seen_at: string | null;
  legion_id: string | null;
  signals_7d: number;
  decisions_7d: number;
  enforcements_7d: number;
};

export const getFleetData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Cast to any: legions table and agents.legion_id are added by manual migration;
    // generated Supabase types haven't been regenerated yet.
    const [legionsRes, agentsRes, loopRes] = await Promise.all([
      (supabase as any).from("legions")
        .select("id,name,description,color")
        .eq("customer_id", userId)
        .order("name"),
      (supabase.from("agents") as any)
        .select("id,display_name,status,provider,last_seen_at,legion_id")
        .eq("customer_id", userId)
        .order("display_name"),
      supabase
        .from("loop_overview_v")
        .select("agent_id,signals_7d,decisions_7d,enforcements_7d")
        .eq("customer_id", userId),
    ]);

    const firstErr = legionsRes.error ?? agentsRes.error ?? loopRes.error;
    if (firstErr) throw new Error((firstErr as { message: string }).message);

    const statsMap = new Map<string, { signals_7d: number; decisions_7d: number; enforcements_7d: number }>();
    for (const row of (loopRes.data ?? []) as { agent_id: string | null; signals_7d: number | null; decisions_7d: number | null; enforcements_7d: number | null }[]) {
      if (row.agent_id) {
        statsMap.set(row.agent_id, {
          signals_7d: row.signals_7d ?? 0,
          decisions_7d: row.decisions_7d ?? 0,
          enforcements_7d: row.enforcements_7d ?? 0,
        });
      }
    }

    const agents: FleetAgent[] = ((agentsRes.data ?? []) as FleetAgent[]).map((a) => ({
      ...a,
      ...(statsMap.get(a.id) ?? { signals_7d: 0, decisions_7d: 0, enforcements_7d: 0 }),
    }));

    return {
      legions: (legionsRes.data ?? []) as FleetLegion[],
      agents,
    };
  });
