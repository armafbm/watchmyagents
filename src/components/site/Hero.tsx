import logo from "@/assets/wma-logo.png";

export function Hero() {
  return (
    <section id="top" className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono uppercase tracking-widest text-primary mb-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-blink" />
            Cybersecurity for AI Agents
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] mb-6">
            Guard every <span className="text-gradient">AI agent</span><br />
            in production.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-8">
            WatchMyAgents detects abnormal behavior, bad practices and signs of compromise
            from your agents' logs and execution signals — then enforces adaptive,
            per-agent security policies.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#cta"
              className="px-6 py-3 rounded-md font-mono text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition glow-cyan"
            >
              Deploy Watch + Shield
            </a>
            <a
              href="#loop"
              className="px-6 py-3 rounded-md font-mono text-sm uppercase tracking-widest border border-border hover:border-primary hover:text-primary transition"
            >
              See the Loop →
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            {[
              { v: "24/7", l: "Live monitoring" },
              { v: "0-trust", l: "Per-agent rules" },
              { v: "SIEM", l: "Native exports" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-display font-bold text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute h-80 w-80 rounded-full border border-primary/30 animate-pulse-ring" />
          <div className="absolute h-80 w-80 rounded-full border border-accent/30 animate-pulse-ring" style={{ animationDelay: "1.2s" }} />
          <div className="absolute h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
          <img
            src={logo}
            alt="WatchMyAgents — AI Agent Cybersecurity"
            className="relative z-10 w-80 h-80 object-contain animate-float drop-shadow-[0_0_40px_rgba(80,180,255,0.5)]"
          />
        </div>
      </div>
    </section>
  );
}
