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
            <div className="font-mono text-sm uppercase tracking-[0.3em] text-primary mb-6">// WMA COMMAND CENTER</div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95]">
              Your <span className="text-gradient">Fortress</span>
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl leading-relaxed font-display font-bold mb-3">
              Watch the unseen. Guard what matters.
            </p>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              Every move your AI makes is watched, analyzed, and defended. Your agents move fast. WatchMyAgents moves faster. Real-time visibility, intelligent defense, total control—keeping your AI systems safe at every decision.
            </p>
          </div>
        </div>


        <div className="grid lg:grid-cols-3 gap-5">
          {/* Live alerts */}
          <div className="border-gradient rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary icon-neon-glow" />
                <h3 className="font-display font-bold">Live alerts & incidents</h3>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">realtime</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left p-3 font-mono">Severity</th>
                    <th className="text-left p-3 font-mono">Agent / env</th>
                    <th className="text-left p-3 font-mono">Category</th>
                    <th className="text-left p-3 font-mono">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((i) => (
                    <tr key={i.signal} className="border-t border-border hover:bg-primary/5 transition">
                      <td className="p-3">
                        <span
                          className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded"
                          style={{
                            background: `color-mix(in oklab, var(--${i.color}) 18%, transparent)`,
                            color: `var(--${i.color})`,
                          }}
                        >
                          {i.sev}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">{i.agent}</td>
                      <td className="p-3 text-muted-foreground">{i.cat}</td>
                      <td className="p-3">{i.signal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suggestion card */}
          <div className="border-gradient rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <GitPullRequest className="h-4 w-4 text-primary icon-neon-glow" />
              <h3 className="font-display font-bold">Policy suggestion</h3>
            </div>
            <div className="font-mono text-xs text-muted-foreground mb-2">watch → shield</div>
            <div className="space-y-3 text-sm">
              <Row k="Trigger" v="Abnormal export > 5MB ×3" />
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
          </div>

          {/* Hygiene */}
          <div className="border-gradient rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert className="h-4 w-4 text-primary icon-neon-glow" />
              <h3 className="font-display font-bold">Per-agent hygiene</h3>
            </div>
            <div className="space-y-4">
              {hygiene.map((h) => (
                <div key={h.agent} className="grid grid-cols-[1fr_auto] gap-4 items-center pb-4 border-b border-border last:border-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm">{h.agent}</span>
                      <span className="text-xs text-muted-foreground">· {h.issue}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-background overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${h.score}%`,
                          background: "var(--gradient-primary)",
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">→ {h.suggest}</div>
                  </div>
                  <div className="font-display text-2xl font-bold text-primary">{h.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="border-gradient rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <UserCheck className="h-4 w-4 text-primary icon-neon-glow" />
              <h3 className="font-display font-bold">Roles & validation</h3>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                ["Viewer", "Read + export"],
                ["Analyst", "Triage + suggest"],
                ["Policy Editor", "Draft rules"],
                ["Approver", "Publish to prod"],
                ["Admin", "SI + retention"],
              ].map(([r, d]) => (
                <li key={r} className="flex items-center justify-between">
                  <span className="font-mono text-xs">{r}</span>
                  <span className="text-muted-foreground text-xs">{d}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Draft → Simulated → Approved → Enforced → Rolled back
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
      <span className="text-muted-foreground text-xs uppercase tracking-wider font-mono">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
