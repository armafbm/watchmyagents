import { Brain, Zap, ShieldCheck, GitBranch, Radar, Bell, FileBarChart, Layers, Ban, Lock, Workflow, Activity } from "lucide-react";
import watchIcon from "@/assets/wma-icon-watch.png";
import guardianIcon from "@/assets/wma-icon-guardian.png";
import shieldIcon from "@/assets/wma-icon-shield.png";

type Capability = { icon: React.ComponentType<{ className?: string }>; title: string; desc: string };
type Accent = "primary" | "accent";

type LayerCardProps = {
  id: string;
  image: string;
  imageAlt: string;
  kicker: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  description: string;
  capabilities: Capability[];
  accent: Accent;
};

const accentStyles: Record<Accent, { kicker: string; icon: string; hover: string; glow: string }> = {
  primary: {
    kicker: "text-primary",
    icon: "text-primary",
    hover: "hover:border-primary/50",
    glow: "drop-shadow-[0_0_60px_hsl(var(--primary)/0.35)]",
  },
  accent: {
    kicker: "text-accent",
    icon: "text-accent",
    hover: "hover:border-accent/50",
    glow: "drop-shadow-[0_0_60px_hsl(var(--accent)/0.35)]",
  },
};

function LayerCard({ id, image, imageAlt, kicker, titlePrefix, titleHighlight, titleSuffix, description, capabilities, accent }: LayerCardProps) {
  const s = accentStyles[accent];
  return (
    <div id={id} className="border-gradient rounded-2xl p-8 md:p-12 relative overflow-hidden scroll-mt-24">
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--${accent})/0.12),transparent_70%)] pointer-events-none`} />
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center relative">
        <div className="flex justify-center">
          <img
            src={image}
            alt={imageAlt}
            className={`h-56 sm:h-72 md:h-[28rem] w-auto max-w-full object-contain animate-float ${s.glow}`}
          />
        </div>
        <div>
          <div className={`font-mono text-xs uppercase tracking-widest ${s.kicker} mb-4`}>
            // {kicker}
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-5">
            {titlePrefix} <span className="text-gradient">{titleHighlight}</span> {titleSuffix}
          </h3>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            {description}
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {capabilities.map((c) => (
              <div
                key={c.title}
                className={`border border-border/60 rounded-xl p-5 bg-background/40 backdrop-blur-sm ${s.hover} transition-colors`}
              >
                <c.icon className={`h-5 w-5 ${s.icon} mb-3 icon-neon-glow`} />
                <h4 className="font-display font-bold mb-1.5">{c.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const watchCapabilities: Capability[] = [
  {
    icon: Radar,
    title: "Full-spectrum capture",
    desc: "Model calls, tool calls, parameters and sensitive data access — instrumented at the SDK layer, nothing slips through.",
  },
  {
    icon: Bell,
    title: "Real-time severity triage",
    desc: "Every signal classified Info → Warning → High → Critical, with the context needed to act in seconds.",
  },
  {
    icon: FileBarChart,
    title: "Tamper-evident timeline",
    desc: "An immutable, audit-ready record of what every agent tried and what it actually did, per agent and per environment.",
  },
  {
    icon: Activity,
    title: "Local-first runtime",
    desc: "Runs on your machine alongside your agents. Zero telemetry leaves your perimeter without your explicit consent.",
  },
];

const guardianCapabilities: Capability[] = [
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

const shieldCapabilities: Capability[] = [
  {
    icon: Ban,
    title: "Tool allow / deny lists",
    desc: "Per-agent, per-environment restrictions on tools, parameters and domains. Block dangerous calls before they fire.",
  },
  {
    icon: Lock,
    title: "Injection & exfiltration block",
    desc: "Stops prompt injection, secret leakage and PII exfiltration in real time, with automatic redaction on the wire.",
  },
  {
    icon: Workflow,
    title: "Rate & token budgets",
    desc: "Hard rate limits, token caps and loop detection — runaway agents are throttled or quarantined automatically.",
  },
  {
    icon: Layers,
    title: "Approved by Guardian",
    desc: "Every active rule is versioned, simulated and signed off. Roll back any policy in one click without redeploying agents.",
  },
];

export function LayerFeatures() {
  return (
    <section id="layers" className="relative py-20 border-t border-border/40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.06),transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="eyebrow eyebrow-accent mb-3">
            // 03 — The three layers in detail
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            One loop, <span className="text-gradient">three layers</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Watch observes. Guardian AI thinks. Shield enforces. Each layer is
            built to do one thing, and to do it brilliantly.
          </p>
        </div>

        <div className="space-y-12">
          <LayerCard
            id="watch"
            image={watchIcon}
            imageAlt="Watch layer icon"
            kicker="Layer 01 · Observation"
            titlePrefix="The"
            titleHighlight="all-seeing eye"
            titleSuffix="of your fleet."
            description="Watch instruments every agent at the SDK and tool layer. Model calls, tool calls, parameters and data access are captured, classified and turned into a triage-ready signal — without ever leaving your machine."
            capabilities={watchCapabilities}
            accent="primary"
          />

          <LayerCard
            id="guardian"
            image={guardianIcon}
            imageAlt="Guardian AI icon"
            kicker="Layer 02 · Brain"
            titlePrefix="The"
            titleHighlight="reasoning core"
            titleSuffix="of the loop."
            description="Guardian is the brain between Watch and Shield. It interprets signals, reasons about intent, and turns raw telemetry into precise, explainable policy decisions — at machine speed, under human authority."
            capabilities={guardianCapabilities}
            accent="accent"
          />

          <LayerCard
            id="shield"
            image={shieldIcon}
            imageAlt="Shield layer icon"
            kicker="Layer 03 · Enforcement"
            titlePrefix="The"
            titleHighlight="enforcement perimeter"
            titleSuffix="of your agents."
            description="Shield runs alongside your agents and applies Guardian-approved policies in real time. Tool allowlists, parameter restrictions, rate limits, PII redaction, auto-quarantine — every guardrail is enforced before damage happens."
            capabilities={shieldCapabilities}
            accent="primary"
          />
        </div>
      </div>
    </section>
  );
}
