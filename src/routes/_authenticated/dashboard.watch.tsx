import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Activity, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat, SevBadge } from "@/components/dashboard/primitives";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/watch")({
  head: () => ({ meta: [{ title: "Watch · Monitoring — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: WatchPage,
});

type Agent = {
  id: string;
  display_name: string;
  anthropic_agent_id: string;
  status: string;
  last_seen_at: string | null;
  shield_mode_detected: string | null;
};

type SignalRow = {
  id: string;
  ingested_at: string;
  agent_id: string;
  payload: { kind?: string; summary?: string; severity?: string } | null;
};

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function severityFor(a: Agent): "OK" | "WARN" | "CRIT" | "INFO" {
  if (!a.last_seen_at) return "INFO";
  const ageMin = (Date.now() - new Date(a.last_seen_at).getTime()) / 60000;
  if (ageMin > 60) return "WARN";
  return "OK";
}

function WatchPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [signalCountByAgent, setSignalCountByAgent] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: s }] = await Promise.all([
        supabase.from("agents").select("*").order("created_at", { ascending: false }),
        supabase
          .from("signals")
          .select("id,ingested_at,agent_id,payload")
          .order("ingested_at", { ascending: false })
          .limit(50),
      ]);
      const aRows = (a as Agent[] | null) ?? [];
      const sRows = (s as SignalRow[] | null) ?? [];
      setAgents(aRows);
      setSignals(sRows);
      const counts: Record<string, number> = {};
      sRows.forEach((r) => {
        counts[r.agent_id] = (counts[r.agent_id] ?? 0) + 1;
      });
      setSignalCountByAgent(counts);
    })();
  }, []);

  const onlineCount = agents.filter((a) => severityFor(a) === "OK").length;

  return (
    <DashboardLayout breadcrumb="Watch · Monitoring">
      <PageHeader
        kicker="Watch"
        layer="watch"
        title="Telemetry for every agent action."
        subtitle="Traces, tool calls and prompts captured by your shield and ingested into Fortress."
        actions={
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Register agent
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Agents registered" value={String(agents.length)} tone="success" icon={Eye} />
        <Stat label="Online (last hour)" value={String(onlineCount)} icon={Activity} tone={onlineCount > 0 ? "success" : "warning"} />
        <Stat label="Signals (recent 50)" value={String(signals.length)} icon={Activity} />
        <Stat label="Unique sources" value={String(Object.keys(signalCountByAgent).length)} />
      </div>

      <Panel title="Agents under watch" icon={Eye} tag={`${agents.length} agent${agents.length === 1 ? "" : "s"}`}>
        {agents.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">No agent registered yet.</p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Register your first agent
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-mono">Agent</th>
                  <th className="text-left p-3 font-mono">Anthropic ID</th>
                  <th className="text-left p-3 font-mono">Shield</th>
                  <th className="text-right p-3 font-mono">Signals (recent)</th>
                  <th className="text-left p-3 font-mono">Severity</th>
                  <th className="text-left p-3 font-mono">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-t border-border/40 hover:bg-primary/5">
                    <td className="p-3 font-mono text-primary">{a.display_name}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                      {a.anthropic_agent_id}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {a.shield_mode_detected ?? "—"}
                    </td>
                    <td className="p-3 text-right font-mono">{signalCountByAgent[a.id] ?? 0}</td>
                    <td className="p-3"><SevBadge sev={severityFor(a)} /></td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{relativeTime(a.last_seen_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title="Signal tail" icon={Activity} tag="last 50">
          {signals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No signals yet. Once your shield ingests events, they show here.
            </p>
          ) : (
            <ul className="divide-y divide-border/40 -my-2 max-h-96 overflow-y-auto">
              {signals.map((s) => (
                <li key={s.id} className="py-2.5 grid grid-cols-[90px_1fr] gap-3">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {new Date(s.ingested_at).toLocaleTimeString()}
                  </span>
                  <div className="text-sm font-mono text-xs">
                    <span className="text-primary">{s.payload?.kind ?? "signal"}</span>
                    <span className="text-muted-foreground"> · {s.payload?.summary ?? JSON.stringify(s.payload)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}
