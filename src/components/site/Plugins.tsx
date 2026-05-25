import knightWatch from "@/assets/wma-knight-watch.png";
import guardianIcon from "@/assets/wma-icon-guardian.png";
import { Brain, Zap, ShieldCheck, GitBranch } from "lucide-react";

const guardianCapabilities = [
  {
    icon: Brain,
    title: "Contextual reasoning",
    desc: "Correlates Watch signals across agents, tools and time windows to surface real threats — not noise.",
  },
  {
    icon: Zap,
    title: "Adaptive policy synthesis",
    desc: "Drafts new Shield policies on the fly from observed behavior, ranked by impact and false-positive risk.",
  },
  {
    icon: ShieldCheck,
    title: "Human-in-the-loop",
    desc: "Every suggestion is explainable, simulatable and reversible. You stay in control of what ships to prod.",
  },
  {
    icon: GitBranch,
    title: "Continuous learning",
    desc: "Feeds policy efficacy back into the loop — Guardian gets sharper with every incident across the fleet.",
  },
];

export function Plugins() {
  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-10 items-center mb-20">
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">// Three layers, one mission</div>
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="text-gradient">Watch</span> sees everything.{" "}
              <span className="text-gradient">Guardian AI</span> thinks.{" "}
              <span className="text-gradient">Shield</span> stops the rest.
            </h2>
          </div>
          <div className="flex justify-center lg:justify-end">
            <img
              src={knightWatch}
              alt="WatchMyAgents knight guardian with all-seeing eye shield"
              className="h-64 lg:h-80 w-auto object-contain animate-float"
            />
          </div>
        </div>

        {/* Guardian AI focus section */}
        <div className="border-gradient rounded-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%)] pointer-events-none" />
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center relative">
            <div className="flex justify-center">
              <img
                src={guardianIcon}
                alt="Guardian AI icon"
                className="h-80 md:h-[28rem] w-auto object-contain animate-float drop-shadow-[0_0_60px_hsl(var(--primary)/0.35)]"
              />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
                // Guardian AI
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-5">
                The <span className="text-gradient">reasoning core</span> of the loop.
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Guardian is the brain between Watch and Shield. It interprets signals,
                reasons about intent, and turns raw telemetry into precise, explainable
                policy decisions — at machine speed, under human authority.
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {guardianCapabilities.map((c) => (
                  <div
                    key={c.title}
                    className="border border-border/60 rounded-xl p-5 bg-background/40 backdrop-blur-sm hover:border-primary/50 transition-colors"
                  >
                    <c.icon className="h-5 w-5 text-primary mb-3" />
                    <h4 className="font-display font-bold mb-1.5">{c.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
