import { Eye, ShieldCheck, Radar, Bell, FileBarChart, Lock, Workflow, Ban } from "lucide-react";

export function Plugins() {
  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">// Two plug-ins, one mission</div>
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-gradient">Watch</span> sees everything.
            <br /><span className="text-gradient">Shield</span> stops the rest.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* WATCH */}
          <div id="watch" className="border-gradient rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-lg bg-primary/15 flex items-center justify-center glow-cyan">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Plug-in 01</div>
                  <h3 className="text-2xl font-bold">Watch</h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Continuous observability over your agents' execution traces. Builds a reliable
                timeline of what each agent <em>tried</em> and what it actually <em>did</em>.
              </p>
              <ul className="space-y-3">
                {[
                  { i: Radar, t: "Model calls, tool invocations, data access, sensitive actions" },
                  { i: Bell, t: "Real-time alerts: Info → Warning → High → Critical" },
                  { i: FileBarChart, t: "Per-agent & aggregated reports across teams and envs" },
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

          {/* SHIELD */}
          <div id="shield" className="border-gradient rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center glow-violet">
                  <ShieldCheck className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Plug-in 02</div>
                  <h3 className="text-2xl font-bold">Shield</h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                A policy engine of customizable rules — per agent — that protects each one
                from itself and from the outside world.
              </p>
              <ul className="space-y-3">
                {[
                  { i: Ban, t: "Tool allow/deny lists, sensitive-action limits, output dump blocking" },
                  { i: Lock, t: "Min-scope permissions, env separation, human-in-the-loop gates" },
                  { i: Workflow, t: "Rate limits, loop caps, auto-quarantine on anomaly" },
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
                <div><span className="text-primary">approval:</span> required if severity ≥ high</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
