import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertOctagon,
  Bot,
  Cpu,
  Eye,
  FileText,
  GitPullRequest,
  Radar,
  ScrollText,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import mascot from "@/assets/wma-mascot.png";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Panel, PageHeader, Stat, SevBadge } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Command Center — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommandCenter,
});

const liveSignals = [
  { sev: "CRIT" as const, t: "00:14", agent: "agent.cartographer", env: "prod", cat: "Data leak", msg: "Mass export to 121.109.215.238", action: "Quarantined" },
  { sev: "HIGH" as const, t: "02:41", agent: "agent.support", env: "prod", cat: "Prompt injection", msg: "Hidden instructions in user input", action: "Sandboxed" },
  { sev: "WARN" as const, t: "06:08", agent: "agent.finance", env: "prod", cat: "Permissions", msg: "Scope=admin on read-only task", action: "Logged" },
  { sev: "INFO" as const, t: "12:30", agent: "agent.ops", env: "staging", cat: "Telemetry", msg: "New tool registered: invoices.lookup", action: "Indexed" },
];

const distribution = [
  { label: "Phishing", n: 4, c: "primary" },
  { label: "Injection", n: 3, c: "danger" },
  { label: "Data leak", n: 2, c: "warning" },
  { label: "Malware", n: 1, c: "accent" },
  { label: "Other", n: 2, c: "muted-foreground" },
];

function CommandCenter() {
  const [alertOpen, setAlertOpen] = useState(true);
  const total = distribution.reduce((s, d) => s + d.n, 0);

  return (
    <DashboardLayout breadcrumb="Command Center">
      {alertOpen && (
        <div className="mb-6 relative rounded-xl border border-danger/40 bg-danger/[0.06] backdrop-blur p-4 flex items-start gap-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none animate-blink" style={{ boxShadow: "inset 0 0 60px oklch(0.65 0.24 25 / 0.15)" }} />
          <span className="mt-0.5 h-2 w-2 rounded-full bg-danger animate-blink shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SevBadge sev="CRIT" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-danger">data_leak</span>
            </div>
            <div className="font-semibold">Data leak attempt · “Crimson Probe”</div>
            <div className="text-sm text-muted-foreground font-mono">
              <span className="text-primary">agent.cartographer</span> · prod from 121.109.215.238 · Shield action:{" "}
              <span className="text-success">QUARANTINED</span> · 315ms
            </div>
          </div>
          <button
            onClick={() => setAlertOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <PageHeader
        kicker="Fortress · command center"
        title="Your AI agents. Under protection."
        subtitle="Realtime posture across every fleet. Watch detects, Shield enforces, Guardian explains."
        actions={
          <div className="hidden md:flex flex-col items-end gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-blink" />
              status: <span className="text-success">secure</span>
            </span>
            <span>region · eu-west-3</span>
            <span>uptime · 99.99%</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Agents protected" value="24" delta="+3 this week" icon={Bot} />
        <Stat label="Signals · 24h" value="412" delta="↑ 18% vs avg" icon={Activity} tone="warning" />
        <Stat label="Threats blocked" value="12" delta="3 critical" icon={Shield} tone="danger" />
        <Stat label="Policy coverage" value="87%" delta="+4% week" icon={Cpu} tone="success" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Hero / mascot */}
        <Panel className="lg:col-span-2 overflow-hidden">
          <div className="relative grid sm:grid-cols-[1fr_auto] gap-6 items-center -m-1">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
                Sentinel.Knight · on watch
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                Observing <span className="text-gradient">24 agents</span> across 7 fleets.
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                2.1M traces · 412 signals · last 24h. No anomalies in last 30 minutes.
              </p>
              <div className="flex flex-wrap gap-2">
                <Pill icon={Zap} tone="primary">+412 signals</Pill>
                <Pill icon={Eye} tone="success">all online</Pill>
                <Pill icon={Shield} tone="warning">1 pending review</Pill>
              </div>
            </div>
            <div className="relative h-44 w-44 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse-ring" />
              <img
                src={mascot}
                alt="WatchMyAgents knight mascot"
                className="relative h-full w-full object-contain animate-float drop-shadow-[0_0_30px_oklch(0.78_0.18_220/0.45)]"
              />
            </div>
          </div>
        </Panel>

        {/* Threat distribution */}
        <Panel title="Threat distribution" tag="24h" icon={AlertOctagon}>
          <div className="flex items-center gap-5">
            <div
              className="relative h-28 w-28 rounded-full grid place-items-center"
              style={{
                background: `conic-gradient(
                  var(--primary) 0 ${(distribution[0].n / total) * 360}deg,
                  var(--danger) ${(distribution[0].n / total) * 360}deg ${((distribution[0].n + distribution[1].n) / total) * 360}deg,
                  var(--warning) ${((distribution[0].n + distribution[1].n) / total) * 360}deg ${((distribution[0].n + distribution[1].n + distribution[2].n) / total) * 360}deg,
                  var(--accent) ${((distribution[0].n + distribution[1].n + distribution[2].n) / total) * 360}deg ${((distribution[0].n + distribution[1].n + distribution[2].n + distribution[3].n) / total) * 360}deg,
                  var(--muted) ${((distribution[0].n + distribution[1].n + distribution[2].n + distribution[3].n) / total) * 360}deg 360deg
                )`,
              }}
            >
              <div className="absolute inset-2 rounded-full bg-card grid place-items-center">
                <div className="text-center">
                  <div className="font-display text-2xl font-bold">{total}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">total</div>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-1.5 text-sm">
              {distribution.map((d) => (
                <li key={d.label} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm" style={{ background: `var(--${d.c})` }} />
                  <span className="flex-1 text-muted-foreground">{d.label}</span>
                  <span className="font-mono text-xs">{d.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Live signals */}
        <Panel
          title="Live signals"
          icon={Activity}
          tag="realtime"
          className="lg:col-span-2"
        >
          <ul className="divide-y divide-border/40 -my-2">
            {liveSignals.map((s, i) => (
              <li key={i} className="py-3 grid grid-cols-[auto_60px_1fr_auto] gap-3 items-start">
                <SevBadge sev={s.sev} />
                <span className="font-mono text-[11px] text-muted-foreground pt-0.5">{s.t}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-primary truncate">{s.agent}</span>
                    <span className="text-muted-foreground">· {s.env}</span>
                  </div>
                  <div className="text-sm truncate">
                    <span className="text-muted-foreground">{s.cat}:</span> {s.msg}
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-success pt-1">
                  {s.action}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Policy suggestion */}
        <Panel title="Policy suggestion" icon={GitPullRequest} tag="watch → shield">
          <div className="space-y-3 text-sm">
            <Row k="Trigger" v="Export > 5MB ×3" />
            <Row k="Proposed" v="Limit size + rate limit" />
            <Row k="Mode" v="Audit → Enforce" />
            <Row k="False positive" v="Medium" />
          </div>
          <div className="mt-5 flex gap-2">
            <button className="flex-1 text-xs font-mono uppercase tracking-widest py-2 rounded bg-primary text-primary-foreground hover:opacity-90">
              Approve
            </button>
            <button className="flex-1 text-xs font-mono uppercase tracking-widest py-2 rounded border border-border hover:border-primary">
              Simulate
            </button>
          </div>
          <Link
            to="/dashboard/shield"
            className="mt-4 block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            view all policies →
          </Link>
        </Panel>
      </div>
    </DashboardLayout>
  );
}

function Pill({
  children,
  icon: Icon,
  tone,
}: {
  children: React.ReactNode;
  icon: typeof Zap;
  tone: "primary" | "success" | "warning";
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono"
      style={{
        borderColor: `color-mix(in oklab, var(--${tone}) 40%, transparent)`,
        background: `color-mix(in oklab, var(--${tone}) 10%, transparent)`,
        color: `var(--${tone})`,
      }}
    >
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
      <span className="text-muted-foreground text-xs uppercase tracking-wider font-mono">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
