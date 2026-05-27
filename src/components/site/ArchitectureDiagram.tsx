import { Bot, Lock, ShieldCheck, Cloud, Cpu, UserCheck } from "lucide-react";
import { LayerIcon } from "@/components/site/LayerIcons";

/**
 * Innovative split-zone architecture diagram:
 *  Client local (Agents → Watch → Fortress → Shield) ⇄ Cloud (Guardian)
 *  gated by a central User Agreement, wrapped in a recursive fractal ring.
 */
export function ArchitectureDiagram() {
  return (
    <div className="relative rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 via-card/40 to-background/80 backdrop-blur-md overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Zone labels */}
      <div className="grid grid-cols-2 border-b border-border/40 font-mono text-[10px] uppercase tracking-widest">
        <div className="flex items-center gap-2 px-5 py-3 text-primary border-r border-border/40">
          <Cpu className="h-3.5 w-3.5" />
          Client · Local edge
        </div>
        <div className="flex items-center gap-2 px-5 py-3 text-accent justify-end">
          Cloud · Anonymized intelligence
          <Cloud className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="relative grid lg:grid-cols-[1.2fr_auto_1fr] gap-6 p-6 md:p-10 items-stretch">
        {/* CLIENT ZONE */}
        <div className="relative space-y-4">
          {/* Agents */}
          <DiagramNode
            tone="muted"
            icon={<Bot className="h-5 w-5 text-foreground/80" />}
            tag="Source"
            title="AI Agents"
            desc="Autonomous agents executing tasks, calling tools and APIs locally."
          />

          {/* Flow arrow */}
          <FlowLine label="observes · logs · NDJSON" />

          {/* Watch */}
          <DiagramNode
            tone="primary"
            iconImg="watch"
            tag="01"
            title="Watch"
            desc="Local observer. Captures actions, events and traces into a daily NDJSON journal — never leaves the machine raw."
          />

          {/* Two columns: Fortress + Shield */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <DiagramNode
              compact
              tone="accent"
              iconImg="fortress"
              tag="02"
              title="Fortress"
              desc="Encrypts & anonymizes the journal before any export."
            />
            <DiagramNode
              compact
              tone="primary"
              iconImg="shield"
              tag="04"
              title="Shield"
              desc="Applies policies locally: sandboxing, rate-limits, kill-switch."
            />
          </div>
        </div>

        {/* CENTER GATE — User Agreement */}
        <div className="relative flex lg:flex-col items-center justify-center">
          {/* Vertical neon spine (desktop) */}
          <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-primary/60 to-transparent" />
          <div className="relative z-10 rounded-2xl border-2 border-primary/50 bg-background/90 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.6)] p-4 w-44 text-center">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
              Gate · 03
            </div>
            <div className="font-display font-bold text-sm mb-1">User Agreement</div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Accept · Modify · Reject. No policy ships without explicit consent.
            </p>
          </div>

          {/* Bidirectional indicator */}
          <div className="hidden lg:flex absolute -bottom-2 left-1/2 -translate-x-1/2 items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <span className="text-primary">⇄</span>
          </div>
        </div>

        {/* CLOUD ZONE */}
        <div className="relative flex flex-col gap-4">
          <FlowLine label="encrypted upload · zero PII" reverse />
          <DiagramNode
            tone="accent"
            iconImg="guardian"
            tag="Cloud"
            title="Guardian"
            desc="Analyzes the cross-fleet corpus, scores risk, generates dashboards & policy suggestions."
            big
          />

          <div className="grid grid-cols-2 gap-3">
            <MiniBadge icon={<ShieldCheck className="h-4 w-4" />} label="Risk score" />
            <MiniBadge icon={<Lock className="h-4 w-4" />} label="Policy draft" />
          </div>

          <FlowLine label="policies · alerts · returns" />

          <div className="rounded-xl border border-dashed border-border/60 p-4 bg-background/40">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Closed loop
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Guardian's recommendations re-enter the client through{" "}
              <span className="text-foreground font-semibold">User Agreement</span>, then arm{" "}
              <span className="text-foreground font-semibold">Shield</span>.
            </p>
          </div>
        </div>
      </div>

      {/* FRACTAL RING — recursive loop band */}
      <div className="relative border-t border-border/40 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 px-6 py-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Recursive fractal loop · self-similar at every scale
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div>
            <span className="text-foreground font-semibold">Agent</span> → detect risks per individual
            agent.
          </div>
          <div>
            <span className="text-foreground font-semibold">Team</span> → correct dangerous behavior
            across coordinated agents.
          </div>
          <div>
            <span className="text-foreground font-semibold">Fleet</span> → anticipate failures & arm
            pre-emptive policies on multi-agent systems.
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagramNode({
  icon,
  iconImg,
  tag,
  title,
  desc,
  tone = "muted",
  compact,
  big,
}: {
  icon?: React.ReactNode;
  iconImg?: "watch" | "guardian" | "shield" | "fortress";
  tag: string;
  title: string;
  desc: string;
  tone?: "primary" | "accent" | "muted";
  compact?: boolean;
  big?: boolean;
}) {
  const ring =
    tone === "primary"
      ? "border-primary/40 hover:border-primary/80 shadow-[0_0_25px_-12px_hsl(var(--primary)/0.5)]"
      : tone === "accent"
      ? "border-accent/40 hover:border-accent/80 shadow-[0_0_25px_-12px_hsl(var(--accent)/0.5)]"
      : "border-border/60 hover:border-foreground/30";
  const tagColor =
    tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-muted-foreground";
  return (
    <div
      className={`group relative rounded-xl border ${ring} bg-card/50 backdrop-blur-sm transition-all ${
        compact ? "p-3" : big ? "p-5" : "p-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 rounded-lg bg-background/70 border border-border/60 flex items-center justify-center ${
            big ? "h-14 w-14" : compact ? "h-9 w-9" : "h-11 w-11"
          }`}
        >
          {iconImg ? (
            <LayerIcon layer={iconImg} className={big ? "h-10 w-10" : compact ? "h-6 w-6" : "h-8 w-8"} />
          ) : (
            icon
          )}
        </div>
        <div className="min-w-0">
          <div className={`font-mono text-[10px] uppercase tracking-widest mb-0.5 ${tagColor}`}>
            {tag}
          </div>
          <div className={`font-display font-bold ${big ? "text-lg" : compact ? "text-sm" : "text-base"}`}>
            {title}
          </div>
          <p className={`text-muted-foreground leading-snug mt-1 ${compact ? "text-[11px]" : "text-xs"}`}>
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function FlowLine({ label, reverse }: { label: string; reverse?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-primary/60" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {reverse ? "← " : ""}
        {label}
        {reverse ? "" : " →"}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-primary/60 via-primary/40 to-transparent" />
    </div>
  );
}

function MiniBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs">
      <span className="text-accent">{icon}</span>
      <span className="text-foreground/80">{label}</span>
    </div>
  );
}
