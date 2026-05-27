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
      </div>
    </section>
  );
}
