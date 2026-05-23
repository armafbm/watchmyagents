import { createFileRoute } from "@tanstack/react-router";
import { Eye, Activity, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat, SevBadge } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_authenticated/dashboard/watch")({
  head: () => ({ meta: [{ title: "Watch · Monitoring — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: WatchPage,
});

const agents = [
  { name: "agent.support", env: "prod", traces: 412_300, signals: 142, sev: "WARN" as const, last: "2s ago" },
  { name: "agent.cartographer", env: "prod", traces: 318_902, signals: 87, sev: "CRIT" as const, last: "14s ago" },
  { name: "agent.finance", env: "prod", traces: 201_412, signals: 39, sev: "INFO" as const, last: "41s ago" },
  { name: "agent.ops", env: "staging", traces: 98_220, signals: 12, sev: "OK" as const, last: "1m ago" },
  { name: "agent.research", env: "prod", traces: 67_001, signals: 8, sev: "OK" as const, last: "2m ago" },
];

function WatchPage() {
  return (
    <DashboardLayout breadcrumb="Watch · Monitoring">
      <PageHeader
        kicker="Watch"
        title="Telemetry for every agent action."
        subtitle="Traces, tool calls, prompts and outputs — captured, indexed, and scanned in realtime."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Active agents" value="24" delta="all online" tone="success" icon={Eye} />
        <Stat label="Traces · 24h" value="2.1M" delta="↑ 12%" icon={Activity} />
        <Stat label="Signals · 24h" value="412" delta="6 unresolved" tone="warning" />
        <Stat label="Avg p95 latency" value="187ms" delta="−9ms vs yesterday" tone="success" />
      </div>

      <Panel title="Agents under watch" icon={Eye} tag={`${agents.length} agents`}>
        <div className="overflow-x-auto -m-5">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-mono">Agent</th>
                <th className="text-left p-3 font-mono">Env</th>
                <th className="text-right p-3 font-mono">Traces 24h</th>
                <th className="text-right p-3 font-mono">Signals</th>
                <th className="text-left p-3 font-mono">Severity</th>
                <th className="text-left p-3 font-mono">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.name} className="border-t border-border/40 hover:bg-primary/5">
                  <td className="p-3 font-mono text-primary">{a.name}</td>
                  <td className="p-3 text-muted-foreground">{a.env}</td>
                  <td className="p-3 text-right font-mono">{a.traces.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{a.signals}</td>
                  <td className="p-3"><SevBadge sev={a.sev} /></td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{a.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <Panel title="Trace tail" icon={Activity} tag="last 30s">
          <pre className="font-mono text-[11px] leading-relaxed text-muted-foreground overflow-x-auto">
{`agent.support · tool=customers.lookup
  allowed=24ms · 0 PII
agent.cartographer · tool=export.csv
  blocked=315ms · reason=size>5MB
agent.finance · tool=invoices.read
  allowed=18ms · scope=read
agent.support · prompt=incoming
  redacted=3 PII tokens
agent.research · tool=web.fetch
  allowed=412ms · 1 redirect`}
          </pre>
        </Panel>
        <Panel title="Filters" icon={Filter}>
          <p className="text-sm text-muted-foreground mb-4">
            Pipe rules for what Watch should capture and how long to retain.
          </p>
          <ul className="space-y-2 text-sm">
            {[
              ["Capture prompts", "ON"],
              ["Capture tool I/O", "ON"],
              ["PII redaction", "Strict"],
              ["Retention", "30 days"],
              ["Sampling", "1.0 (all)"],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-border/40 pb-2 last:border-0">
                <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">{k}</span>
                <span className="font-mono text-xs text-primary">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
