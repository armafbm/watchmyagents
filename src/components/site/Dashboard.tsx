import {
  Shield,
  Inbox,
  Activity,
  Zap,
  FileText,
  Radar,
  BadgeCheck,
  Eye,
  Brain,
  Lock,
  Target,
  AlertTriangle,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import castleIcon from "@/assets/wma-fortress-castle-cutout.png";
import knightShield from "@/assets/wma-knight.png";
import watchEye from "@/assets/wma-icon-watch.png";
import guardianBrain from "@/assets/wma-icon-guardian.png";

/* ---------- Mock data, modeled on real Fortress screens ---------- */

const kpis = [
  { label: "Agents protected", value: "5", icon: Shield, tone: "primary" },
  { label: "Actions · 24h", value: "18.4k", icon: Activity, tone: "accent" },
  { label: "Blocked · 24h", value: "326", icon: Lock, tone: "success" },
  { label: "Tokens · 24h", value: "4.2M", icon: Zap, tone: "primary" },
];

const protectedAgents = [
  { name: "Assistant Personnel CEO", provider: "ANTHROPIC-MANAGED", seen: "31/05 22:15:18" },
  { name: "Agent Financier", provider: "ANTHROPIC-MANAGED", seen: "30/05 15:04:34" },
  { name: "Deep researcher", provider: "ANTHROPIC-MANAGED", seen: "30/05 13:04:46" },
  { name: "Test Agent", provider: "ANTHROPIC-MANAGED", seen: "25/05 20:25:04" },
  { name: "agent_01UNy3MizTnJ3s7Wg…", provider: "ANTHROPIC-MANAGED", seen: "never seen" },
];

const suggestions = [
  { sev: "high", title: "New tool usage · bash + write", agent: "agent.financier", score: 40 },
  { sev: "high", title: "Deny web_search on high error rate", agent: "deep.researcher", score: 55 },
  { sev: "med", title: "Alert on web_fetch errors", agent: "deep.researcher", score: 35 },
  { sev: "low", title: "Tighten allowlist · web_fetch", agent: "fleet · all", score: 22 },
];

const policies = [
  {
    id: "deep-researcher-websearch-high-error-deny",
    name: "Deny web_search if error rate is high",
    action: "DENY",
    agent: "DEEP RESEARCHER",
  },
  {
    id: "deep-researcher-webfetch-error-alert",
    name: "Alert on Web Fetch errors",
    action: "INTERRUPT",
    agent: "DEEP RESEARCHER",
  },
  { id: "p2-webfetch-allowlist", name: "web_fetch allowlist", action: "DENY", agent: "FLEET" },
  {
    id: "agent-financier-new-tool-bash-deny",
    name: "Deny new tool · bash",
    action: "DENY",
    agent: "AGENT FINANCIER",
  },
];

const watchSignals = [
  { t: "15:03:40", tool: "bash", state: "ok" },
  { t: "15:02:45", tool: "bash", state: "ok" },
  { t: "15:02:40", tool: "write", state: "ok" },
  { t: "16:45:26", tool: "web_fetch", state: "err", msg: "URL outside curated allowlist" },
  { t: "16:42:32", tool: "web_search", state: "ok" },
  { t: "16:42:31", tool: "web_search", state: "ok" },
];

const intel = [
  {
    icon: FileText,
    status: "LIVE",
    title: "Reports & Audit",
    desc: "Every decision auditable. Exportable for SOC2 evidence.",
  },
  {
    icon: Radar,
    status: "SOON",
    title: "Threat Intel",
    desc: "Live IOCs, adversary playbooks, agent-specific feeds.",
  },
  {
    icon: BadgeCheck,
    status: "SOON",
    title: "Compliance",
    desc: "SOC2 · ISO27001 · EU AI Act mapping out of the box.",
  },
];

const sevStyle: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  med: "bg-warning/15 text-warning border-warning/30",
  low: "bg-primary/15 text-primary border-primary/30",
};

const actionStyle: Record<string, string> = {
  DENY: "bg-destructive/15 text-destructive border-destructive/40",
  INTERRUPT: "bg-warning/15 text-warning border-warning/40",
  ALLOW: "bg-success/15 text-success border-success/40",
};

/* ---------- Component ---------- */

export function Dashboard() {
  return (
    <section id="dashboard" className="relative py-20 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="flex flex-col items-center gap-10 lg:gap-16 mb-16 text-center">
          <div className="max-w-3xl">
            <div className="eyebrow mb-6">// FORTRESS · COMMAND CENTER</div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95]">
              YOUR <span className="text-gradient">FORTRESS</span>
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl leading-relaxed font-display font-bold mb-3">
              Your AI agents. <span className="text-gradient">Under protection.</span>
            </p>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              One command center to watch every action, score every risk, and enforce every policy —
              with full audit trail.
            </p>
          </div>
          <img
            src={castleIcon}
            alt="WMA Fortress castle"
            className="h-64 sm:h-80 md:h-[34rem] w-auto max-w-full object-contain shrink-0 animate-float drop-shadow-[0_0_80px_hsl(var(--primary)/0.4)]"
          />
        </div>

        {/* Guardian alert banner */}
        <div className="border-gradient rounded-2xl p-4 mb-5 flex items-center gap-4 bg-warning/5">
          <div className="h-10 w-10 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
            <Inbox className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-base">
              Guardian has <span className="text-warning">4 pending suggestions</span>.
            </div>
            <div className="text-xs text-muted-foreground">Review them to harden your shield.</div>
          </div>
          <button className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 rounded border border-warning/50 text-warning hover:bg-warning/10 transition">
            Review →
          </button>
        </div>

        {/* Eyebrow + Status row */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="eyebrow text-xs">// FORTRESS · COMMAND CENTER</div>
          <div className="hidden sm:flex items-center gap-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> status ·{" "}
              <span className="text-success">secure</span>
            </span>
            <span>region · eu-west-3</span>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {kpis.map((k) => (
            <div key={k.label} className="border-gradient rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {k.label}
                </div>
                <k.icon className={`h-4 w-4 text-${k.tone}`} />
              </div>
              <div className="font-display text-4xl font-bold text-gradient">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Sentinel · on watch */}
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
            <div className="rounded-lg border border-border bg-background/40 p-5 flex items-center gap-5">
              <img
                src={knightShield}
                alt=""
                className="hidden sm:block h-28 w-28 object-contain drop-shadow-[0_0_24px_hsl(var(--primary)/0.5)]"
              />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
                  sentinel.knight · on watch
                </div>
                <div className="text-xl md:text-2xl font-display font-bold mb-3">
                  Observing <span className="text-gradient">5 agents</span>.
                </div>
                <div className="font-mono text-xs text-muted-foreground mb-4">
                  18 412 actions · 326 blocked · last 24h.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip tone="primary">⚡ 18.4k actions</Chip>
                  <Chip tone="success">● 5 online</Chip>
                  <Chip tone="warning">○ 4 pending</Chip>
                </div>
              </div>
            </div>
          </div>

          {/* Guardian inbox */}
          <div className="border-gradient rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Guardian inbox</h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-warning">
                4 pending
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-2 mb-4">
              <img
                src={guardianBrain}
                alt=""
                className="h-16 w-16 object-contain mb-2 drop-shadow-[0_0_20px_hsl(var(--warning)/0.6)]"
              />
              <div className="font-display text-5xl font-bold text-warning leading-none">4</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                suggestions waiting
              </div>
            </div>
            <button className="w-full text-xs font-mono uppercase tracking-widest py-2 rounded border border-border hover:border-primary transition flex items-center justify-center gap-1.5">
              Open Guardian inbox <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Protected agents */}
          <div className="border-gradient rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Protected agents</h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                5
              </span>
            </div>
            <ul className="divide-y divide-border/60 rounded-lg border border-border bg-background/40">
              {protectedAgents.map((a) => (
                <li key={a.name} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-success shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-display font-bold leading-tight truncate">
                      {a.name}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                      {a.provider} · <span className="text-success">active</span> · last seen{" "}
                      {a.seen}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-primary hidden sm:inline">
                    view →
                  </span>
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
            <ul className="space-y-3">
              {[
                ["Shield", "Manage policies", Lock],
                ["Guardian", "Review suggestions", Brain],
                ["Watch", "Tail signals", Eye],
                ["Keys", "Manage API keys", BadgeCheck],
              ].map(([label, desc, Icon]) => {
                const I = Icon as typeof Lock;
                return (
                  <li
                    key={label as string}
                    className="rounded-lg border border-border bg-background/40 p-3 flex items-center gap-3 hover:border-primary transition"
                  >
                    <I className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                        {label as string}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{desc as string}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Guardian validation queue (featured suggestion card) */}
          <div className="border-gradient rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Validation queue</h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-warning">
                4 pending
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>// source agent</span>
                <Chip tone="destructive">ANTHROPIC</Chip>
                <span className="text-foreground font-display font-bold normal-case tracking-normal text-sm">
                  Agent Financier
                </span>
                <Chip tone="muted">GENERIC · COLD_START · 96%</Chip>
                <Chip tone="success">○ BLOCK-CAPABLE</Chip>
              </div>

              <div className="flex items-start gap-4 mb-3">
                <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-center shrink-0">
                  <div className="font-display text-2xl font-bold text-warning leading-none">
                    40
                  </div>
                  <div className="font-mono text-[8px] uppercase tracking-widest text-warning mt-1">
                    elevated
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-base mb-1">
                    New Tool Usage Detected
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    perimeter_drift · confidence 50%
                  </div>
                </div>
                <Chip tone="destructive">DENY</Chip>
              </div>

              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 mb-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
                  // objective
                </div>
                <div className="text-sm text-foreground/90 leading-snug">
                  Prevent unauthorized tool usage and maintain a defined operational perimeter.
                </div>
              </div>

              <pre className="rounded-md border border-border bg-background/70 p-3 text-[11px] font-mono text-muted-foreground overflow-x-auto leading-relaxed">
                {`RULE_ID  agent-financier-deny-new-tools
{
  "tool_name": { "not_in": ["bash", "write"] },
  "action_type": "tool_use"
}`}
              </pre>

              <div className="flex items-center justify-between mt-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-success flex items-center gap-1">
                  <Check className="h-3 w-3" /> enforceable now
                </span>
                <div className="flex gap-2">
                  <button className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded border border-primary/50 text-primary hover:bg-primary/10 transition flex items-center gap-1.5">
                    <Check className="h-3 w-3" /> Accept
                  </button>
                  <button className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition flex items-center gap-1.5">
                    <X className="h-3 w-3" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Watch · Live telemetry */}
          <div className="border-gradient rounded-2xl p-6 relative overflow-hidden">
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
            <ul className="space-y-1.5 rounded-lg border border-border bg-background/40 p-2">
              {watchSignals.map((s, i) => (
                <li key={i} className="flex items-center gap-2 px-2 py-1.5 rounded">
                  {s.state === "ok" ? (
                    <Check className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground w-14 shrink-0">
                    {s.t}
                  </span>
                  <span className="font-mono text-[11px] text-primary shrink-0">{s.tool}</span>
                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                    · {s.state === "ok" ? "(default)" : s.msg}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Shield · Policies (full row) */}
          <div className="border-gradient rounded-2xl p-6 lg:col-span-3 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Shield · Policies</h3>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-2">
                  5 active · 4 from Guardian
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary hidden sm:inline">
                + new policy
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background/40 overflow-hidden">
              <div className="hidden md:grid grid-cols-[1.2fr_2fr_1fr_0.6fr] px-4 py-2 border-b border-border bg-background/60 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                <span>rule_id</span>
                <span>name</span>
                <span>applies to</span>
                <span className="text-right">action</span>
              </div>
              <ul className="divide-y divide-border/60">
                {policies.map((p) => (
                  <li
                    key={p.id}
                    className="grid md:grid-cols-[1.2fr_2fr_1fr_0.6fr] gap-2 px-4 py-3 items-center"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground truncate">
                      {p.id}
                    </span>
                    <span className="text-sm font-display font-bold truncate">{p.name}</span>
                    <span className="hidden md:block">
                      <Chip tone="muted">{p.agent}</Chip>
                    </span>
                    <span className="md:text-right">
                      <Chip className={actionStyle[p.action]}>{p.action}</Chip>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Intelligence row */}
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-5">
            {intel.map((it) => (
              <div
                key={it.title}
                className="border-gradient rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <it.icon className="h-4 w-4 text-primary icon-neon-glow" />
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                      it.status === "LIVE"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/30 text-muted-foreground"
                    }`}
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

/* ---------- Sub-components ---------- */

function Chip({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone?: "primary" | "success" | "warning" | "destructive" | "muted";
  className?: string;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/15 text-primary border-primary/30",
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    destructive: "bg-destructive/15 text-destructive border-destructive/30",
    muted: "bg-muted/30 text-muted-foreground border-border",
  };
  const base = tone ? tones[tone] : "";
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${base} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
