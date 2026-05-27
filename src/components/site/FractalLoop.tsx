import { Cpu, Cloud } from "lucide-react";
import { ArchitectureDiagram } from "@/components/site/ArchitectureDiagram";
import recursiveFractalLoopShield from "@/assets/recursive-fractal-loop-shield-clean.png";

export function FractalLoop() {
  return (
    <section id="fractal" className="relative py-14 border-t border-border/40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="flex items-start gap-8 mb-12">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How it <span className="text-gradient">works</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Watch and Shield run <span className="text-foreground font-semibold">locally on your machine</span>. Guardian runs in the cloud on anonymized data. You stay in control.
            </p>
          </div>
          <img
            src={recursiveFractalLoopShield}
            alt="WatchMyAgents shield"
            className="hidden md:block h-48 w-auto object-contain shrink-0 animate-float"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4 text-primary" />
            <span>Runs on your computer</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4 text-accent" />
            <span>Runs in the cloud</span>
          </div>
        </div>

        <ArchitectureDiagram />
      </div>
    </section>
  );
}
