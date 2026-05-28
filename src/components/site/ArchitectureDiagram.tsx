import { ArrowRight, Cpu, Cloud, UserCheck, BarChart3, Lightbulb, Rocket, Brain } from "lucide-react";
import { LayerIcon } from "@/components/site/LayerIcons";

/**
 * Horizontal architecture diagram inspired by the user's sketch:
 *   WATCH (local) → encrypted export → FORTRESS CLOUD (Guardian AI + pipeline + User Agreement) → SHIELD (local)
 */
export function ArchitectureDiagram() {
  return (
    <div className="relative rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 via-card/40 to-background/80 backdrop-blur-md p-3 md:p-4">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[60%] rounded-full bg-accent/10 blur-3xl pointer-events-none -z-10" />

      <div className="relative flex flex-col lg:flex-row items-stretch gap-2">
        {/* LEFT — WATCH (local) */}
        <LocalNode
          layer="watch"
          title="Watch"
          desc="Observes your agents and records a daily log."
        />

        {/* Arrow + encrypted export */}
        <Connector label="encrypted & anonymized export" />

        {/* CENTER — FORTRESS CLOUD */}
        <div className="relative flex-1 rounded-3xl border-2 border-dashed border-accent/60 bg-gradient-to-br from-accent/10 via-background/40 to-primary/5 p-5 md:p-8 pt-8 md:pt-10">
          <div className="absolute -top-4 left-6 px-4 py-1.5 rounded-full bg-background border-2 border-accent/70 flex items-center gap-2 shadow-[0_0_20px_-4px_hsl(var(--accent)/0.6)]">
            <Cloud className="h-4 w-4 text-accent" />
            <span className="font-display font-bold text-[11px] tracking-[0.2em] uppercase text-accent">
              Fortress Cloud · WatchMyAgents
            </span>
          </div>

          {/* Guardian AI badge — hero of the cloud */}
          <div className="flex justify-center mb-6 mt-2">
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/40 via-primary/30 to-accent/40 blur-xl opacity-70 animate-pulse" />
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-accent/60 via-primary/50 to-accent/60 opacity-80" />
              <div className="relative flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-accent/60 bg-background/90 backdrop-blur-xl shadow-[0_0_50px_-10px_hsl(var(--accent)/0.7)]">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-accent/30 blur-lg animate-pulse" />
                  <LayerIcon layer="guardian" className="relative h-10 w-10 drop-shadow-[0_0_12px_hsl(var(--accent)/0.8)]" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent mb-0.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    AI brain · always on
                  </div>
                  <div className="font-display font-bold text-base flex items-center gap-1.5 bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
                    <Brain className="h-4 w-4 text-accent" /> Guardian AI
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 items-stretch">
            <PipelineStep icon={<BarChart3 className="h-5 w-5" />} title="Analyze" subtitle="signals" />
            <PipelineStep icon={<LayerIcon layer="fortress" className="h-6 w-6" />} title="Dashboard" subtitle="report" />
            <PipelineStep icon={<Lightbulb className="h-5 w-5" />} title="Suggest" subtitle="policies" />
            <PipelineStep
              icon={<UserCheck className="h-5 w-5" />}
              title="User"
              subtitle="agreement"
              highlight
            />
            <PipelineStep icon={<Rocket className="h-5 w-5" />} title="Deploy" subtitle="policies" />
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-4 leading-snug">
            Nothing is deployed without your explicit approval.
          </p>
        </div>

        {/* Arrow */}
        <Connector label="approved policies" />

        {/* RIGHT — SHIELD (local) */}
        <LocalNode
          layer="shield"
          title="Shield"
          desc="Applies the approved policies on your machine."
        />
      </div>

      {/* Local / Cloud legend strip */}
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-primary" /> Local — on your computer
        </span>
        <span className="flex items-center gap-1.5">
          <Cloud className="h-3.5 w-3.5 text-accent" /> Cloud — anonymized data only
        </span>
      </div>
    </div>
  );
}

function LocalNode({
  layer,
  title,
  desc,
}: {
  layer: "watch" | "shield";
  title: string;
  desc: string;
}) {
  return (
    <div className="relative lg:w-40 shrink-0 rounded-2xl border-2 border-primary/40 bg-background/70 p-3 flex flex-col items-center text-center shadow-[0_0_25px_-12px_hsl(var(--primary)/0.5)]">
      <div className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/50 flex items-center gap-1 mb-3">
        <Cpu className="h-3 w-3 text-primary" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-primary">Local</span>
      </div>
      <LayerIcon layer={layer} className="h-24 w-24 mb-3" />
      <div className="font-display font-bold text-xl">{title}</div>
      <p className="text-xs text-muted-foreground leading-snug mt-1.5">{desc}</p>
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex lg:flex-col items-center justify-center gap-2 lg:w-14 shrink-0">
      <div className="hidden lg:block text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-center px-1 leading-tight">
        {label}
      </div>
      <ArrowRight className="h-5 w-5 text-primary lg:rotate-0 rotate-90" />
      <div className="lg:hidden text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-center">
        {label}
      </div>
    </div>
  );
}

function PipelineStep({
  icon,
  title,
  subtitle,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`min-h-[110px] rounded-xl border p-3 flex flex-col items-center justify-center text-center bg-background/80 backdrop-blur-sm transition-colors ${
        highlight
          ? "border-primary/70 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.7)] bg-primary/5"
          : "border-accent/30 hover:border-accent/60"
      }`}
    >
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center mb-2 ${
          highlight ? "bg-primary/20 text-primary" : "bg-accent/15 text-accent"
        }`}
      >
        {icon}
      </div>
      <div className="font-display font-bold text-xs md:text-sm leading-tight text-foreground whitespace-nowrap w-full px-0.5">{title}</div>
      {subtitle && (
        <div className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.12em] text-muted-foreground mt-1 leading-tight whitespace-nowrap w-full px-0.5">
          {subtitle}
        </div>
      )}
    </div>
  );
}
