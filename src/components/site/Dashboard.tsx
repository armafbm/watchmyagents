import { Shield, Inbox, Activity, Zap, FileText, Radar, BadgeCheck, Check, Ban, AlertTriangle, Eye } from "lucide-react";
import castleIcon from "@/assets/wma-fortress-castle-cutout.png";

const kpis = [
  { label: "Agents protected", value: "247" },
  { label: "Actions · 24h", value: "18.4k" },
  { label: "Blocked · 24h", value: "326" },
  { label: "Tokens · 24h", value: "4.2M" },
];

const timeline = [
  { t: "12:42:08", icon: Ban, tone: "danger", agent: "agent.sales-copilot", msg: "Blocked · prompt injection attempt", tag: "SHIELD" },
  { t: "12:41:55", icon: Check, tone: "ok", agent: "agent.support-bot", msg: "Allowed · refund query (policy v3.2)", tag: "ALLOW" },
  { t: "12:41:31", icon: AlertTriangle, tone: "warn", agent: "agent.research-001", msg: "Flagged · PII in tool call args", tag: "GUARDIAN" },
  { t: "12:41:02", icon: Check, tone: "ok", agent: "agent.ops-runner", msg: "Allowed · scheduled task #4821", tag: "ALLOW" },
  { t: "12:40:47", icon: Ban, tone: "danger", agent: "agent.sales-copilot", msg: "Blocked · exfil pattern on /export", tag: "SHIELD" },
  { t: "12:40:12", icon: Eye, tone: "info", agent: "agent.support-bot", msg: "Observed · 142 msgs · latency 412ms", tag: "WATCH" },
];

const suggestions = [
  { sev: "high", title: "Tighten data-egress policy", agent: "agent.sales-copilot" },
  { sev: "med", title: "Rotate API key (38d old)", agent: "agent.ops-runner" },
  { sev: "low", title: "Enable PII redaction on logs", agent: "agent.support-bot" },
];

const intel = [
  { icon: FileText, status: "LIVE", title: "Reports & Audit", desc: "Decision history, exportable for audit." },
  { icon: Radar, status: "SOON", title: "Threat Intel", desc: "Live feeds, IOCs and adversary playbooks." },
  { icon: BadgeCheck, status: "SOON", title: "Compliance", desc: "SOC2 · ISO27001 · EU AI Act mapping." },
];

const toneColor: Record<string, string> = {
  ok: "text-primary",
  danger: "text-destructive",
  warn: "text-warning",
  info: "text-muted-foreground",
};

const sevStyle: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  med: "bg-warning/15 text-warning",
  low: "bg-primary/15 text-primary",
};

export function Dashboard() {
  return (
    <section id="dashboard" className="relative py-20 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center gap-10 lg:gap-16 mb-16 text-center">
          <div className="max-w-3xl">
            <div className="font-mono text-sm uppercase tracking-[0.3em] text-primary mb-6">// FORTRESS · COMMAND CENTER</div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95]">
              MY <span className="text-gradient">FORTRESS</span>
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl leading-relaxed font-display font-bold mb-3">
              Your AI agents. <span className="text-gradient">Under protection.</span>
            </p>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              Watch detects, Shield enforces, Guardian explains. One command center for every agent you ship — with audit, intelligence and compliance built in.
            </p>
          </div>
          <img
            src={castleIcon}
            alt="WMA Fortress castle"
            className="h-64 sm:h-80 md:h-[36rem] lg:h-[42rem] w-auto max-w-full object-contain shrink-0 animate-float drop-shadow-[0_0_80px_hsl(var(--primary)/0.4)]"
          />
        </div>


        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {kpis.map((k) => (
            <div key={k.label} className="border-gradient rounded-2xl p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{k.label}</div>
              <div className="font-display text-4xl font-bold text-gradient">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Sentinel Knight — on watch */}
          <div className="border-gradient rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Sentinel.Knight · on watch</h3>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">status: idle · eu-west-3</span>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">No agent connected yet</div>
              <div className="text-lg md:text-xl font-display font-bold mb-4">
                Register your first agent to start watching.
              </div>
              <button className="text-xs font-mono uppercase tracking-widest py-2 px-4 rounded bg-primary text-primary-foreground hover:opacity-90">
                Register an agent →
              </button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <QuickAction label="Shield" sub="Manage policies" />
              <QuickAction label="Guardian" sub="Review suggestions" />
              <QuickAction label="Keys" sub="Manage API keys" />
            </div>
          </div>

          {/* Sentinel Knight — on watch */}
          <div className="border-gradient rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Sentinel.Knight · on watch</h3>
              </div>
              <span className="font-mono text-[10px] text-primary uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                active · eu-west-3
              </span>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">sentinel.knight · on watch</div>
              <div className="text-xl md:text-2xl font-display font-bold mb-3">
                Observing <span className="text-gradient">247 agents</span>.
              </div>
              <div className="font-mono text-xs text-muted-foreground mb-4">
                18 412 actions · 326 blocked · last 24h.
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-primary/15 text-primary">⚡ 18.4k actions</span>
                <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-success/15 text-success">● 247 online</span>
                <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-destructive/15 text-destructive">⛔ 326 blocked</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <QuickAction label="Shield" sub="Manage policies" />
              <QuickAction label="Guardian" sub="Review suggestions" />
              <QuickAction label="Keys" sub="Manage API keys" />
            </div>
          </div>

          {/* Guardian inbox */}
          <div className="border-gradient rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Guardian inbox</h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-warning">3 pending</span>
            </div>
            <ul className="space-y-2.5 mb-4">
              {suggestions.map((s) => (
                <li key={s.title} className="flex items-start gap-2.5 rounded-lg border border-border bg-background/40 p-2.5">
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 ${sevStyle[s.sev]}`}>{s.sev}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-display font-bold leading-tight truncate">{s.title}</div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">{s.agent}</div>
                  </div>
                </li>
              ))}
            </ul>
            <button className="w-full text-xs font-mono uppercase tracking-widest py-2 rounded border border-border hover:border-primary">
              Open Guardian inbox →
            </button>
          </div>

          {/* Live timeline */}
          <div className="border-gradient rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Live timeline</h3>
              </div>
              <span className="font-mono text-[10px] text-primary uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                realtime
              </span>
            </div>
            <ul className="divide-y divide-border/60 rounded-lg border border-border bg-background/40">
              {timeline.map((e, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2">
                  <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0">{e.t}</span>
                  <e.icon className={`h-3.5 w-3.5 shrink-0 ${toneColor[e.tone]}`} />
                  <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0 ${e.tone === "danger" ? "bg-destructive/15 text-destructive" : e.tone === "warn" ? "bg-warning/15 text-warning" : e.tone === "ok" ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"}`}>{e.tag}</span>
                  <span className="font-mono text-[11px] text-muted-foreground truncate hidden sm:inline">{e.agent}</span>
                  <span className="text-xs flex-1 truncate">{e.msg}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick actions */}
          <div className="border-gradient rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="h-4 w-4 text-primary icon-neon-glow" />
              <h3 className="font-display font-bold">Quick actions</h3>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                ["Shield", "Manage policies"],
                ["Guardian", "Review suggestions"],
                ["Keys", "Manage API keys"],
                ["Watch", "Tail signals"],
                ["Legions", "Fleets & roles"],
              ].map(([r, d]) => (
                <li key={r} className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-widest">{r}</span>
                  <span className="text-muted-foreground text-xs">{d}</span>
                </li>
              ))}
            </ul>
          </div>


          {/* Intelligence row */}
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-5">
            {intel.map((it) => (
              <div key={it.title} className="border-gradient rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <it.icon className="h-4 w-4 text-primary icon-neon-glow" />
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded"
                    style={{
                      background: `color-mix(in oklab, var(--${it.status === "LIVE" ? "primary" : "muted"}) 18%, transparent)`,
                      color: it.status === "LIVE" ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {it.status}
                  </span>
                </div>
                <h4 className="font-display font-bold text-lg mb-1">{it.title}</h4>
                <p className="text-sm text-muted-foreground">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickAction({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border p-3 hover:border-primary transition">
      <div className="font-mono text-[10px] uppercase tracking-widest text-primary">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
