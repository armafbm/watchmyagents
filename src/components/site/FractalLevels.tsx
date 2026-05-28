import { Bot, Users, Network, Building2 } from "lucide-react";

export function FractalLevels() {
  return (
    <section id="fractal-levels" className="relative py-20 border-t border-border/40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.06),transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="eyebrow mb-3">
            // 02 — Four fractal levels
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            The same loop, at <span className="text-gradient">every scale</span>
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed">
            The Watch → Guardian → Shield loop runs recursively — on a single agent,
            on a team, on a full multi-agent system, and across your whole organization.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Bot, level: "L1", title: "Single agent", desc: "Per-agent observation, scoring and policy enforcement." },
            { icon: Users, level: "L2", title: "Team of agents", desc: "Cross-agent correlation inside a legion (e.g. Support, Finance)." },
            { icon: Network, level: "L3", title: "Multi-agent system", desc: "System-wide risk patterns across agents, tools and data flows." },
            { icon: Building2, level: "L4", title: "Whole organization", desc: "Org-level posture, shared policies and collective intelligence." },
          ].map(({ icon: Icon, level, title, desc }) => (
            <div
              key={level}
              className="relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {level}
                </span>
              </div>
              <div className="font-display font-bold text-lg mb-1.5">{title}</div>
              <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
