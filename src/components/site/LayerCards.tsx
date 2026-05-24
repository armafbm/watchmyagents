import { Radar, Bell, FileBarChart, Lock, Workflow, Ban, GitBranch, Sparkles, LineChart } from "lucide-react";
import { LayerIcon } from "@/components/site/LayerIcons";

export function LayerCards({ withIds = true }: { withIds?: boolean } = {}) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* WATCH */}
      <div id={withIds ? "watch" : undefined} className="border-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-14 w-14 rounded-lg bg-primary/15 flex items-center justify-center glow-cyan p-1.5">
              <LayerIcon layer="watch" className="h-10 w-10" alt="Watch" />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Layer 01</div>
              <h3 className="text-2xl font-bold">Watch</h3>
            </div>
          </div>
          <p className="text-muted-foreground mb-6 text-sm">
            Instruments and collects every agent execution trace — building a reliable
            timeline of what each agent <em>tried</em> and what it actually <em>did</em>.
          </p>
          <ul className="space-y-3">
            {[
              { i: Radar, t: "Model calls, tool calls, data access, sensitive actions" },
              { i: Bell, t: "Real-time alerts: Info → Warning → High → Critical" },
              { i: FileBarChart, t: "Triage context for every signal, per agent & per env" },
            ].map((x, k) => (
              <li key={k} className="flex items-start gap-3 text-sm">
                <x.i className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{x.t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-lg bg-background/60 border border-border p-4 font-mono text-xs space-y-1.5">
            <div className="text-muted-foreground">// live stream</div>
            <div><span className="text-success">[INFO]</span> agent.support → tool.crm.read OK</div>
            <div><span className="text-warning">[WARN]</span> agent.finance → scope=admin (unusual)</div>
            <div><span className="text-danger animate-blink">[CRIT]</span> agent.ops → suspected exfiltration</div>
          </div>
        </div>
      </div>

      {/* GUARDIAN AI */}
      <div id={withIds ? "guardian" : undefined} className="border-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-14 w-14 rounded-lg bg-accent/20 flex items-center justify-center glow-violet p-1.5">
              <LayerIcon layer="guardian" className="h-10 w-10" alt="Guardian AI" />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Layer 02 · Brain</div>
              <h3 className="text-2xl font-bold">Guardian AI</h3>
            </div>
          </div>
          <p className="text-muted-foreground mb-6 text-sm">
            The intelligence layer. Normalizes Watch signals, scores risk and hygiene,
            governs the lifecycle of rules and proposes ready-to-validate policies for Shield.
          </p>
          <ul className="space-y-3">
            {[
              { i: LineChart, t: "Signal correlation, hygiene & risk scoring per agent" },
              { i: Sparkles, t: "Auto-suggested rules with rationale & false-positive estimate" },
              { i: GitBranch, t: "Governance: simulation, approval, versioning, rollback" },
            ].map((x, k) => (
              <li key={k} className="flex items-start gap-3 text-sm">
                <x.i className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{x.t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-lg bg-background/60 border border-border p-4 font-mono text-xs space-y-1.5">
            <div className="text-muted-foreground">// guardian.suggest()</div>
            <div><span className="text-primary">trigger:</span> export &gt; 5MB ×3 in 2m</div>
            <div><span className="text-primary">propose:</span> size_limit + rate_limit</div>
            <div><span className="text-primary">est_fp:</span> medium · <span className="text-success">approve?</span></div>
          </div>
        </div>
      </div>

      {/* SHIELD */}
      <div id="shield" className="border-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-14 w-14 rounded-lg bg-primary/15 flex items-center justify-center glow-cyan p-1.5">
              <LayerIcon layer="shield" className="h-10 w-10" alt="Shield" />
            </div>
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Layer 03</div>
              <h3 className="text-2xl font-bold">Shield</h3>
            </div>
          </div>
          <p className="text-muted-foreground mb-6 text-sm">
            The enforcement engine — per-agent, per-environment policies that protect
            each agent from itself and from the outside world.
          </p>
          <ul className="space-y-3">
            {[
              { i: Ban, t: "Tool allow/deny lists, parameter & domain restrictions" },
              { i: Lock, t: "Injection / exfiltration protection, PII & secret redaction" },
              { i: Workflow, t: "Rate limits, token budgets, loop caps, auto-quarantine" },
            ].map((x, k) => (
              <li key={k} className="flex items-start gap-3 text-sm">
                <x.i className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{x.t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-lg bg-background/60 border border-border p-4 font-mono text-xs space-y-1.5">
            <div className="text-muted-foreground">// policy.shield.yaml</div>
            <div><span className="text-primary">rule:</span> block_export &gt; 5MB</div>
            <div><span className="text-primary">tools:</span> allowlist=[crm, mailer]</div>
            <div><span className="text-primary">approval:</span> required if sev ≥ high</div>
          </div>
        </div>
      </div>
    </div>
  );
}
