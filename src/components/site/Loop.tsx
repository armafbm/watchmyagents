import { ArrowRight } from "lucide-react";
import legions from "@/assets/wma-legions.png";
import { LayerIcon, type LayerKey } from "@/components/site/LayerIcons";

export function Loop() {
  return (
    <section id="loop" className="relative py-28 overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">// The feedback loop</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Security that <span className="text-gradient">learns</span>, agent by agent.
          </h2>
          <p className="text-muted-foreground text-lg">
            Watch observes in production. Guardian AI thinks, scores and suggests.
            Shield enforces. Watch measures the effect — and the loop tunes itself.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <img
            src={legions}
            alt="WatchMyAgents legions — Customer Services, HR, Marketing, Dev Team"
            className="w-full max-w-2xl h-auto object-contain animate-float"
          />
        </div>


        <div className="grid lg:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-6">
          <LoopNode
            color="primary"
            Icon={Eye}
            label="Layer 01 · Watch"
            title="Observe"
            items={["Model & tool calls", "Data access & exports", "Sensitive actions", "Security signals"]}
          />
          <Arrow />
          <LoopNode
            color="accent"
            Icon={BrainCircuit}
            label="Layer 02 · Guardian AI"
            title="Think & suggest"
            items={["Correlation & scoring", "Hygiene & risk reports", "Rule suggestions", "Impact simulation"]}
          />
          <Arrow />
          <LoopNode
            color="primary"
            Icon={ShieldCheck}
            label="Layer 03 · Shield"
            title="Enforce"
            items={["Per-agent policy", "Draft → Approved → Enforced", "Human-in-the-loop", "Audit & rollback"]}
          />
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
            <span className="h-2 w-2 rounded-full bg-success animate-blink" />
            <span className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
              loop.run() → collective intelligence, risk decreases over time
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <div className="hidden lg:flex items-center justify-center text-primary">
      <ArrowRight className="h-6 w-6 animate-pulse" />
    </div>
  );
}

function LoopNode({
  Icon, label, title, items, color,
}: { Icon: any; label: string; title: string; items: string[]; color: "primary" | "accent" }) {
  return (
    <div className="border-gradient rounded-2xl p-6 relative overflow-hidden scanline">
      <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full blur-2xl ${color === "primary" ? "bg-primary/20" : "bg-accent/20"}`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color === "primary" ? "bg-primary/15 text-primary" : "bg-accent/20 text-accent-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className="font-display font-bold">{title}</div>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground font-mono">
          {items.map((i) => <li key={i}>› {i}</li>)}
        </ul>
      </div>
    </div>
  );
}
