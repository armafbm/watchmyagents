import { Infinity as InfinityIcon, ShieldCheck, Bot, Users, Network, Building2 } from "lucide-react";
import { LayerCards } from "@/components/site/LayerCards";

export function RecursiveFractalLoop() {
  return (
    <section id="recursive-fractal" className="relative py-20 border-t border-border/40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.08),transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/40 bg-accent/5 mb-5">
            <InfinityIcon className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Our technology · WGS methodology
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5">
            Recursive Fractal <span className="text-gradient">Security Loop™</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-3">
            Watch. Guardian. Shield. A self-reinforcing loop where every observation feeds
            smarter analysis, every analysis feeds stronger policies, and every policy
            sharpens the next observation — on each agent, then on whole teams of agents.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Inspired by the ISO 27 001 norm</span>
          </div>
        </div>

        <LayerCards withIds={false} />

        {/* Fractal levels */}
        <div className="mt-20">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">
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
              {
                icon: Bot,
                level: "L1",
                title: "Single agent",
                desc: "Per-agent observation, scoring and policy enforcement.",
              },
              {
                icon: Users,
                level: "L2",
                title: "Team of agents",
                desc: "Cross-agent correlation inside a legion (e.g. Support, Finance).",
              },
              {
                icon: Network,
                level: "L3",
                title: "Multi-agent system",
                desc: "System-wide risk patterns across agents, tools and data flows.",
              },
              {
                icon: Building2,
                level: "L4",
                title: "Whole organization",
                desc: "Org-level posture, shared policies and collective intelligence.",
              },
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
      </div>
    </section>
  );
}
