import { Shield, Inbox, Activity, Zap, FileText, Radar, BadgeCheck } from "lucide-react";
import castleIcon from "@/assets/wma-fortress-castle-cutout.png";

const kpis = [
  { label: "Agents protected", value: "0" },
  { label: "Actions · 24h", value: "0" },
  { label: "Blocked · 24h", value: "0" },
  { label: "Tokens · 24h", value: "0" },
];

const intel = [
  { icon: FileText, status: "LIVE", title: "Reports & Audit", desc: "Decision history, exportable for audit." },
  { icon: Radar, status: "SOON", title: "Threat Intel", desc: "Live feeds, IOCs and adversary playbooks." },
  { icon: BadgeCheck, status: "SOON", title: "Compliance", desc: "SOC2 · ISO27001 · EU AI Act mapping." },
];

export function Dashboard() {
  return (
    <section id="dashboard" className="relative py-20 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-16">
          <img
            src={castleIcon}
            alt="WMA Fortress castle"
            className="h-64 sm:h-80 md:h-[36rem] lg:h-[42rem] w-auto max-w-full object-contain shrink-0 animate-float drop-shadow-[0_0_80px_hsl(var(--primary)/0.4)]"
          />
          <div className="max-w-3xl">
            <div className="font-mono text-sm uppercase tracking-[0.3em] text-primary mb-6">// FORTRESS · COMMAND CENTER</div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95]">
              Your AI agents. <span className="text-gradient">Under protection.</span>
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl leading-relaxed font-display font-bold mb-3">
              Realtime posture across every fleet.
            </p>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              Watch detects, Shield enforces, Guardian explains. One command center for every agent you ship — with audit, intelligence and compliance built in.
            </p>
          </div>
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

          {/* Guardian inbox */}
          <div className="border-gradient rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Guardian inbox</h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-warning">pending</span>
            </div>
            <div className="font-display text-5xl font-bold text-gradient mb-2">0</div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
              suggestions waiting
            </div>
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
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">realtime</span>
            </div>
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                No decisions yet
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Once your shield runs, decisions appear here in realtime.
              </div>
            </div>
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
