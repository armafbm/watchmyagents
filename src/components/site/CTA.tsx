import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <section id="cta" className="relative py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-6">// Early access</div>
        <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6">
          Don't wait for your first <span className="text-gradient">agent incident</span>.
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          Join the early-access program and deploy Watch + Shield on your production agents
          in days, not quarters.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            placeholder="you@company.com"
            className="flex-1 px-4 py-3 rounded-md bg-input border border-border focus:border-primary focus:outline-none font-mono text-sm"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-md font-mono text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition glow-cyan"
          >
            Request Access
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-6 font-mono">
          Or email <a href="mailto:minedor@watchmyagents.com" className="text-primary hover:underline">minedor@watchmyagents.com</a>
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="font-mono text-xs uppercase tracking-widest">
          © {new Date().getFullYear()} WatchMyAgents · Cybersecurity for AI Agents
        </div>
        <div className="flex gap-6 font-mono text-xs uppercase tracking-widest">
          <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          <a href="mailto:minedor@watchmyagents.com" className="hover:text-primary">Contact</a>
        </div>
      </div>
    </footer>
  );
}
