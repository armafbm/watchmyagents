import { createFileRoute } from "@tanstack/react-router";
import { Swords, Users, Activity, Plus, MoreHorizontal, Cpu, Layers } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat, SevBadge } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_authenticated/dashboard/legions")({
  head: () => ({
    meta: [
      { title: "Legions · Agentic Fleet Management — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LegionsPage,
});

type FleetStatus = "OK" | "WARN" | "CRIT" | "INFO";

const fleets: {
  name: string;
  mission: string;
  agents: number;
  model: string;
  tasks24h: number;
  successRate: string;
  status: FleetStatus;
}[] = [
  { name: "legion.alpha", mission: "Customer support tier-1", agents: 8, model: "gpt-5", tasks24h: 12_482, successRate: "98.4%", status: "OK" },
  { name: "legion.cartograph", mission: "Web research & indexing", agents: 5, model: "claude-3.7", tasks24h: 4_120, successRate: "94.1%", status: "WARN" },
  { name: "legion.finance", mission: "Invoice & expense parsing", agents: 4, model: "gpt-5-mini", tasks24h: 2_201, successRate: "99.2%", status: "OK" },
  { name: "legion.ops", mission: "Internal automation", agents: 3, model: "gemini-2.5-flash", tasks24h: 988, successRate: "87.6%", status: "CRIT" },
  { name: "legion.research", mission: "Long-horizon research", agents: 2, model: "gpt-5", tasks24h: 312, successRate: "96.0%", status: "INFO" },
  { name: "legion.scout", mission: "Lead enrichment", agents: 2, model: "gemini-2.5-flash-lite", tasks24h: 1_540, successRate: "92.3%", status: "OK" },
];

function LegionsPage() {
  return (
    <DashboardLayout breadcrumb="Legions · Agentic Fleet Management">
      <PageHeader
        kicker="Legions"
        title="Command your agentic fleets."
        subtitle="Group agents into mission-bound legions. Assign models, scale capacity, and orchestrate workflows from a single command surface."
        actions={
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition">
            <Plus className="h-4 w-4" />
            Deploy Legion
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Legions" value={String(fleets.length)} delta="6 deployed" tone="success" icon={Swords} />
        <Stat label="Agents enlisted" value={String(fleets.reduce((s, f) => s + f.agents, 0))} delta="↑ 4 this week" icon={Users} />
        <Stat label="Tasks · 24h" value="21.6K" delta="↑ 8%" icon={Activity} />
        <Stat label="Avg success rate" value="94.6%" delta="−0.3% vs 7d" tone="warning" icon={Cpu} />
      </div>

      <Panel title="Fleet roster" icon={Layers} tag={`${fleets.length} legions`}>
        <div className="overflow-x-auto -m-5">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-mono">Legion</th>
                <th className="text-left p-3 font-mono">Mission</th>
                <th className="text-left p-3 font-mono">Agents</th>
                <th className="text-left p-3 font-mono">Model</th>
                <th className="text-right p-3 font-mono">Tasks · 24h</th>
                <th className="text-right p-3 font-mono">Success</th>
                <th className="text-center p-3 font-mono">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {fleets.map((f) => (
                <tr key={f.name} className="border-t border-border/30 hover:bg-secondary/30 transition">
                  <td className="p-3 font-mono text-primary">{f.name}</td>
                  <td className="p-3 text-muted-foreground">{f.mission}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {f.agents}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{f.model}</td>
                  <td className="p-3 text-right font-mono">{f.tasks24h.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{f.successRate}</td>
                  <td className="p-3 text-center"><SevBadge level={f.status} /></td>
                  <td className="p-3 text-right">
                    <button className="h-7 w-7 grid place-items-center rounded-md hover:bg-secondary/60 text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </DashboardLayout>
  );
}
