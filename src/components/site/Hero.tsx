import { Logo3D } from "./Logo3D";

export function Hero() {
  return (
    <section id="top" className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono uppercase tracking-widest text-primary mb-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-blink" />
            Runtime cybersecurity for AI agents
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] mb-6">
            Your <span className="text-gradient">AI agents</span>.<br />
            Under protection.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-8">
            WatchMyAgents is a runtime security infrastructure for autonomous AI agents.
            Three layers — <span className="text-primary">Watch</span>,{" "}
            <span className="text-primary">Guardian AI</span> and{" "}
            <span className="text-primary">Shield</span> — connected by a live feedback loop
            that turns observability into adaptive enforcement, agent by agent.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#cta"
              className="px-6 py-3 rounded-md font-mono text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition glow-cyan"
            >
              Request access
            </a>
            <a
              href="#loop"
              className="px-6 py-3 rounded-md font-mono text-sm uppercase tracking-widest border border-border hover:border-primary hover:text-primary transition"
            >
              See the loop →
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            {[
              { v: "3-layer", l: "Watch · Guardian · Shield" },
              { v: "0-trust", l: "Per-agent policies" },
              { v: "SIEM", l: "Native exports" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-display font-bold text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-[28rem] lg:h-[34rem] flex items-center justify-center">
          <Logo3D className="w-full h-full" />
        </div>
      </div>
    </section>
  );
}
