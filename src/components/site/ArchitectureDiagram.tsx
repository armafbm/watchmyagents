import { ArrowRight, Cpu, Cloud, UserCheck, BarChart3, Lightbulb, Rocket, Brain } from "lucide-react";
import { LayerIcon } from "@/components/site/LayerIcons";

/**
 * Horizontal architecture diagram inspired by the user's sketch:
 *   WATCH (local) → encrypted export → FORTRESS CLOUD (Guardian AI + pipeline + User Agreement) → SHIELD (local)
 */
export function ArchitectureDiagram() {
  return (
    <div className="relative rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 via-card/40 to-background/80 backdrop-blur-md overflow-hidden p-6 md:p-10">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[60%] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-stretch gap-6">
        {/* LEFT — WATCH (local) */}
        <LocalNode
          layer="watch"
          title="Watch"
          desc="Observes your agents and records a daily log."
        />

        {/* Arrow + encrypted export */}
        <Connector label="encrypted & anonymized export" />

        {/* CENTER — FORTRESS CLOUD */}
        <div className="relative flex-1 rounded-3xl border-2 border-dashed border-accent/60 bg-accent/5 p-5 md:p-6">
          <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-background border border-accent/60 flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 text-accent" />
            <span className="font-display font-bold text-xs tracking-wide">
              Fortress Cloud · WatchMyAgents
            </span>
          </div>

          {/* Guardian AI badge */}
          <div className="flex justify-center mb-5 mt-1">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-accent/50 bg-background/70 shadow-[0_0_30px_-10px_hsl(var(--accent)/0.6)]">
              <LayerIcon layer="guardian" className="h-7 w-7" />
              <div className="text-left">
                <div className="font-mono text-[9px] uppercase tracking-widest text-accent">
                  AI brain
                </div>
                <div className="font-display font-bold text-sm flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5" /> Guardian AI
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
            <PipelineStep icon={<BarChart3 className="h-4 w-4" />} title="Analyze" />
            <PipelineStep icon={<LayerIcon layer="fortress" className="h-5 w-5" />} title="Dashboard" subtitle="report" />
            <PipelineStep icon={<Lightbulb className="h-4 w-4" />} title="Suggest" subtitle="policies" />
            <PipelineStep
              icon={<UserCheck className="h-4 w-4" />}
              title="User"
              subtitle="agreement"
              highlight
            />
            <PipelineStep icon={<Rocket className="h-4 w-4" />} title="Deploy" subtitle="policies" />
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
    <div className="relative lg:w-44 shrink-0 rounded-2xl border-2 border-primary/40 bg-background/70 p-4 flex flex-col items-center text-center shadow-[0_0_25px_-12px_hsl(var(--primary)/0.5)]">
      <div className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/50 flex items-center gap-1">
        <Cpu className="h-3 w-3 text-primary" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-primary">Local</span>
      </div>
      <LayerIcon layer={layer} className="h-12 w-12 mt-1 mb-2" />
      <div className="font-display font-bold text-base">{title}</div>
      <p className="text-[11px] text-muted-foreground leading-snug mt-1">{desc}</p>
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex lg:flex-col items-center justify-center gap-2 lg:w-24 shrink-0">
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
      className={`rounded-xl border p-3 flex flex-col items-center text-center bg-background/70 transition-colors ${
        highlight
          ? "border-primary/60 shadow-[0_0_20px_-8px_hsl(var(--primary)/0.6)]"
          : "border-border/60 hover:border-accent/50"
      }`}
    >
      <div
        className={`h-8 w-8 rounded-lg flex items-center justify-center mb-1.5 ${
          highlight ? "bg-primary/15 text-primary" : "bg-accent/10 text-accent"
        }`}
      >
        {icon}
      </div>
      <div className="font-display font-bold text-xs">{title}</div>
      {subtitle && (
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </div>
      )}
    </div>
  );
}
