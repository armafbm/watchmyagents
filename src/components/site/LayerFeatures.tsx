import { Brain, Cpu, Cloud, Radar, Bell, FileBarChart, LineChart, Sparkles, GitBranch, Ban, Lock, Workflow } from "lucide-react";
import { LayerIcon } from "@/components/site/LayerIcons";

type Feature = { icon: React.ComponentType<{ className?: string }>; text: string };
type Accent = "primary" | "accent";

const styles: Record<Accent, {
  halo: string;
  ring: string;
  border: string;
  shadow: string;
  glow: string;
  badge: string;
  dot: string;
  text: string;
  iconBorder: string;
  iconGlow: string;
  iconDrop: string;
  title: string;
  runtimeText: string;
  hover: string;
  pillBg: string;
  pillText: string;
  pillIcon: string;
}> = {
  primary: {
    halo: "from-primary/30 via-accent/20 to-primary/30",
    ring: "from-primary/60 via-accent/40 to-primary/60",
    border: "border-primary/40",
    shadow: "shadow-[0_0_60px_-15px_hsl(var(--primary)/0.5)]",
    glow: "bg-primary/20",
    badge: "border-primary/40 bg-primary/10",
    dot: "bg-primary",
    text: "text-primary",
    iconBorder: "border-primary/50",
    iconGlow: "bg-primary/30",
    iconDrop: "drop-shadow-[0_0_12px_hsl(var(--primary)/0.8)]",
    title: "from-foreground via-primary to-foreground",
    runtimeText: "text-primary",
    hover: "hover:border-primary/40",
    pillBg: "bg-primary/10",
    pillText: "text-primary",
    pillIcon: "text-primary",
  },
  accent: {
    halo: "from-accent/30 via-primary/20 to-accent/30",
    ring: "from-accent/60 via-primary/40 to-accent/60",
    border: "border-accent/40",
    shadow: "shadow-[0_0_60px_-15px_hsl(var(--accent)/0.5)]",
    glow: "bg-accent/20",
    badge: "border-accent/40 bg-accent/10",
    dot: "bg-accent",
    text: "text-accent",
    iconBorder: "border-accent/50",
    iconGlow: "bg-accent/30",
    iconDrop: "drop-shadow-[0_0_12px_hsl(var(--accent)/0.8)]",
    title: "from-foreground via-accent to-foreground",
    runtimeText: "text-accent",
    hover: "hover:border-accent/40",
    pillBg: "bg-accent/10",
    pillText: "text-accent",
    pillIcon: "text-accent",
  },
};

type LayerFeatureProps = {
  id: string;
  layer: "watch" | "guardian" | "shield";
  badge: string;
  badgeDot: string;
  title: string;
  tagline: string;
  description: string;
  features: Feature[];
  runtime: { icon: React.ComponentType<{ className?: string }>; label: string };
  accent: Accent;
  terminal: React.ReactNode;
};

function LayerFeature({
  id,
  layer,
  badge,
  badgeDot,
  title,
  tagline,
  description,
  features,
  runtime,
  accent,
  terminal,
}: LayerFeatureProps) {
  const s = styles[accent];
  const RuntimeIcon = runtime.icon;

  return (
    <div id={id} className="relative group">
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${s.halo} blur-2xl opacity-60 animate-pulse pointer-events-none`} />
      <div className={`absolute -inset-px rounded-3xl bg-gradient-to-r ${s.ring} opacity-70 pointer-events-none`} />

      <div className={`relative rounded-3xl border ${s.border} bg-background/90 backdrop-blur-xl ${s.shadow} overflow-hidden`}>
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
        <div className={`absolute -top-32 -right-32 h-72 w-72 rounded-full ${s.glow} blur-3xl pointer-events-none`} />

        <div className="relative grid lg:grid-cols-5 gap-8 p-6 md:p-10">
          {/* Left — branding */}
          <div className="lg:col-span-2 flex flex-col">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${s.badge} w-fit mb-5`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} />
              <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${s.text}`}>
                {badge}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative shrink-0">
                <div className={`absolute inset-0 rounded-2xl ${s.iconGlow} blur-xl animate-pulse`} />
                <div className={`relative h-20 w-20 rounded-2xl border ${s.iconBorder} bg-background/70 flex items-center justify-center`}>
                  <LayerIcon layer={layer} className={`h-14 w-14 ${s.iconDrop}`} />
                </div>
              </div>
              <div>
                <h3 className={`text-3xl md:text-4xl font-display font-bold bg-gradient-to-r ${s.title} bg-clip-text text-transparent`}>
                  {title}
                </h3>
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  {badgeDot}
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {tagline}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-background/60 w-fit text-xs">
              <RuntimeIcon className={`h-3.5 w-3.5 ${s.runtimeText}`} />
              <span className="text-muted-foreground">{runtime.label}</span>
            </div>
          </div>

          {/* Middle — features */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <p className="text-base text-foreground/90 leading-relaxed">
              {description}
            </p>
            <ul className="space-y-3">
              {features.map(({ icon: Icon, text }, k) => (
                <li
                  key={k}
                  className={`flex items-start gap-3 text-sm p-3 rounded-xl border border-border/40 bg-background/40 ${s.hover} transition-colors`}
                >
                  <div className={`h-8 w-8 rounded-lg ${s.pillBg} ${s.pillText} flex items-center justify-center shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="pt-1.5 leading-snug">{text}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-background/80 border border-border p-4 font-mono text-xs space-y-1.5">
              {terminal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LayerFeatures() {
  return (
    <section id="layers" className="relative py-20 border-t border-border/40">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.06),transparent_70%)] pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
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
          <LayerFeature
            id="watch"
            layer="watch"
            badge="Layer 01 · Observation"
            badgeDot="The sensor"
            accent="primary"
            title="Watch"
            tagline="Your eyes on every agent — a precise, tamper-evident timeline of what every agent tried and what it actually did."
            description="Watch instruments your agents at the SDK and tool layer. Every model call, tool call, parameter and data access is captured, classified and turned into a triage-ready signal."
            runtime={{ icon: Cpu, label: "Runs locally on your machine" }}
            features={[
              { icon: Radar, text: "Model calls, tool calls, data access, sensitive actions" },
              { icon: Bell, text: "Real-time alerts: Info → Warning → High → Critical" },
              { icon: FileBarChart, text: "Triage context for every signal, per agent & per environment" },
            ]}
            terminal={
              <>
                <div className="text-muted-foreground">// live stream</div>
                <div><span className="text-success">[INFO]</span> agent.support → tool.crm.read OK</div>
                <div><span className="text-warning">[WARN]</span> agent.finance → scope=admin (unusual)</div>
                <div><span className="text-danger animate-blink">[CRIT]</span> agent.ops → suspected exfiltration</div>
              </>
            }
          />

          <LayerFeature
            id="guardian"
            layer="guardian"
            badge="Layer 02 · Brain"
            badgeDot="AI · always on"
            accent="accent"
            title="Guardian AI"
            tagline="The intelligence layer. Correlates signals, scores risk, and proposes the policies Shield should enforce — with rationale and false-positive estimates."
            description="Guardian normalizes the firehose from Watch, learns the baseline of each agent and legion, and turns anomalies into ready-to-validate rules. Nothing is deployed without your explicit approval."
            runtime={{ icon: Cloud, label: "Runs in Fortress Cloud · anonymized data only" }}
            features={[
              { icon: LineChart, text: "Signal correlation, hygiene & risk scoring per agent" },
              { icon: Sparkles, text: "Auto-suggested rules with rationale & false-positive estimate" },
              { icon: GitBranch, text: "Governance: simulation, approval, versioning, rollback" },
            ]}
            terminal={
              <>
                <div className="text-muted-foreground">// guardian.suggest()</div>
                <div><span className="text-accent">trigger:</span> export &gt; 5MB ×3 in 2m</div>
                <div><span className="text-accent">propose:</span> size_limit + rate_limit</div>
                <div><span className="text-accent">est_fp:</span> medium · <span className="text-success">approve?</span></div>
              </>
            }
          />

          <LayerFeature
            id="shield"
            layer="shield"
            badge="Layer 03 · Enforcement"
            badgeDot="The bouncer"
            accent="primary"
            title="Shield"
            tagline="The enforcement engine — per-agent, per-environment policies that protect each agent from itself and from the outside world."
            description="Shield runs alongside your agents and applies the approved policies in real time. Tool allowlists, parameter restrictions, rate limits, PII redaction, auto-quarantine — all enforced before damage happens."
            runtime={{ icon: Cpu, label: "Runs locally on your machine" }}
            features={[
              { icon: Ban, text: "Tool allow/deny lists, parameter & domain restrictions" },
              { icon: Lock, text: "Injection / exfiltration protection, PII & secret redaction" },
              { icon: Workflow, text: "Rate limits, token budgets, loop caps, auto-quarantine" },
            ]}
            terminal={
              <>
                <div className="text-muted-foreground">// policy.shield.yaml</div>
                <div><span className="text-primary">rule:</span> block_export &gt; 5MB</div>
                <div><span className="text-primary">tools:</span> allowlist=[crm, mailer]</div>
                <div><span className="text-primary">approval:</span> required if sev ≥ high</div>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}
