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

    const degraded = !!(todayRes.error || decisionsRes.error || agentsRes.error);

    return {
      degraded,
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
// Fleet management data (SDK v1.2.x hierarchy)
// ----------------------------------------------------------------
export type FleetAgent = {
  id: string;
  display_name: string;
  status: string;
  provider: string | null;
  last_seen_at: string | null;
  fleet_id: string | null;
  signals_7d: number;
  decisions_7d: number;
  enforcements_7d: number;
};

export type TeamRow = {
  id: string;
  fleet_id: string;
  name: string;
  description: string | null;
  criticality: "low" | "medium" | "high" | "critical";
  owner_user_id: string | null;
  tags: string[];
  notes: string | null;
  auto_detected_from: string;
  agents: FleetAgent[];
};

export type FleetRow = {
  id: string;
  name: string;
  description: string | null;
  runtime: string;
  api_key_id: string | null;
  teams: TeamRow[];
};

export const getFleetData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [fleetsRes, teamsRes, agentsRes, membershipRes, loopRes] = await Promise.all([
      (supabase as any).from("fleets")
        .select("id,name,description,runtime,api_key_id")
        .eq("customer_id", userId)
        .order("name"),
      (supabase as any).from("teams")
        .select("id,fleet_id,name,description,criticality,owner_user_id,tags,notes,auto_detected_from")
        .eq("customer_id", userId)
        .order("name"),
      (supabase as any).from("agents")
        .select("id,display_name,status,provider,last_seen_at,fleet_id")
        .eq("customer_id", userId)
        .order("display_name"),
      (supabase as any).from("agent_team_membership")
        .select("agent_id,team_id"),
      supabase
        .from("loop_overview_v")
        .select("agent_id,signals_7d,decisions_7d,enforcements_7d")
        .eq("customer_id", userId),
    ]);

    const firstErr = fleetsRes.error ?? teamsRes.error ?? agentsRes.error;
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

    const agentTeamMap = new Map<string, string[]>();
    for (const m of (membershipRes.data ?? []) as { agent_id: string; team_id: string }[]) {
      const list = agentTeamMap.get(m.agent_id) ?? [];
      list.push(m.team_id);
      agentTeamMap.set(m.agent_id, list);
    }

    const allAgents: FleetAgent[] = ((agentsRes.data ?? []) as FleetAgent[]).map((a) => ({
      ...a,
      ...(statsMap.get(a.id) ?? { signals_7d: 0, decisions_7d: 0, enforcements_7d: 0 }),
    }));

    const agentById = new Map(allAgents.map((a) => [a.id, a]));

    const teams: TeamRow[] = ((teamsRes.data ?? []) as Omit<TeamRow, "agents">[]).map((t) => {
      const memberIds = [...agentTeamMap.entries()]
        .filter(([, tids]) => tids.includes(t.id))
        .map(([aid]) => aid);
      return { ...t, agents: memberIds.map((id) => agentById.get(id)).filter(Boolean) as FleetAgent[] };
    });

    const teamsByFleet = new Map<string, TeamRow[]>();
    for (const t of teams) {
      const list = teamsByFleet.get(t.fleet_id) ?? [];
      list.push(t);
      teamsByFleet.set(t.fleet_id, list);
    }

    const fleets: FleetRow[] = ((fleetsRes.data ?? []) as Omit<FleetRow, "teams">[]).map((f) => ({
      ...f,
      teams: teamsByFleet.get(f.id) ?? [],
    }));

    // agents with no fleet_id at all
    const unfleeted_agents = allAgents.filter((a) => !a.fleet_id);

    return { fleets, all_agents: allAgents, unfleeted_agents };
  });
