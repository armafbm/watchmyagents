import { RefreshCw, ArrowUp, ArrowDown, User, Users, Layers, Globe } from "lucide-react";
import { LayerIcon, type LayerKey } from "@/components/site/LayerIcons";
import { LayerCards } from "@/components/site/LayerCards";

type CycleStep = {
  label: string;
  desc: string;
  layer?: LayerKey;
  icon?: typeof RefreshCw;
};

const cycle: CycleStep[] = [
  { layer: "watch", label: "Watch", desc: "Observes logs, traces, drift, token burn, latency." },
  { layer: "guardian", label: "Guardian", desc: "Analyzes risk, reports findings, suggests policies." },
  { layer: "shield", label: "Shield", desc: "Enforces rate limits, sandboxing, isolation, auto-remediation." },
  { icon: RefreshCw, label: "Re-Watch", desc: "Measures policy efficacy and feeds Guardian back." },
];

const levels = [
  {
    icon: User,
    tag: "Level 1",
    title: "Unitary Agent",
    desc: "Per-agent behavior: drift, anomaly signals, API call patterns, token burn.",
  },
  {
    icon: Users,
    tag: "Level 2",
    title: "Team Intelligence",
    desc: "Inter-agent communication, shared resources, cascade risks, RBAC, quotas.",
  },
  {
    icon: Layers,
    tag: "Level 3",
    title: "Fleet Intelligence",
    desc: "Cross-agent patterns at fleet scale (10 → 1000+): dependencies, auto-scaling.",
  },
  {
    icon: Globe,
    tag: "Level 4",
    title: "Global Intelligence",
    desc: "Anonymized meta-learning across all users: universal threat signatures, zero-day indicators.",
  },
];

export function FractalLoop() {
  return (
    <section id="fractal" className="relative py-28 border-t border-border/40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="max-w-3xl mb-16">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
            // Our technology
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Recursive <span className="text-gradient">Fractal Security Loop</span>™
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A self-similar, recursive threat intelligence architecture. The same{" "}
            <span className="text-foreground font-semibold">Watch → Guardian → Shield</span> cycle
            runs at every hierarchical level — metrics flow up, policies flow down.
          </p>
        </div>

        {/* WGS Cycle - three layers */}
        <div className="mb-20">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
            01 — The WGS Cycle
          </div>
          <LayerCards />
        </div>

        {/* Fractal levels */}
        <div className="mb-20">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
            02 — Four fractal levels
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {levels.map((l) => (
              <div
                key={l.tag}
                className="border border-border/60 rounded-xl p-6 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <l.icon className="h-6 w-6 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {l.tag}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{l.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bidirectional flow */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
              03 — Bidirectional data flow
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Metrics flow up. Policies flow down.
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <ArrowUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <span className="text-foreground font-semibold">Upward:</span> metrics aggregate
                  agent → team → fleet → global.
                </span>
              </li>
              <li className="flex gap-3">
                <ArrowDown className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <span className="text-foreground font-semibold">Downward:</span> learned policies
                  cascade global → fleet → team → agent.
                </span>
              </li>
              <li className="flex gap-3">
                <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <span className="text-foreground font-semibold">Continuous:</span> real-time
                  closed loop at every level — no dead-ends, no manual relay.
                </span>
              </li>
            </ul>
          </div>

          <div className="border-gradient rounded-xl p-6 font-mono text-xs leading-relaxed bg-background/60">
            <pre className="text-muted-foreground overflow-x-auto">{`Level 4  ── Global
   ↑ anonymized metrics  ↓ collective learning
Level 3  ── Fleet
   ↑ fleet context       ↓ fleet policies
Level 2  ── Team
   ↑ team constraints    ↓ team policies
Level 1  ── Agent
   ↑ individual metrics  ↓ agent policies`}</pre>
          </div>
        </div>

        <p className="mt-16 text-xs font-mono text-muted-foreground/70">
          Fractal Security Loop™ — trademark of WatchMyAgents · PCT pending (filed 05/23/2026).
        </p>
      </div>
    </section>
  );
}
