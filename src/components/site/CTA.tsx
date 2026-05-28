import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export function CTA() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) || value.length > 255) {
      toast.error("Please enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          source: "landing_cta",
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        toast.error("Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setEmail("");
      if (data.alreadyRegistered) {
        toast.success("You're already on the list — we'll be in touch.");
      } else {
        toast.success("You're in. Check your inbox for confirmation.");
      }
    } catch {
      setLoading(false);
      toast.error("Something went wrong. Please try again.");
    }
  };


  return (
    <section id="cta" className="relative py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="eyebrow mb-6">// Early access</div>
        <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6">
          Don't wait for your first <span className="text-gradient">agent incident</span>.
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          Join the early-access program and deploy Watch + Shield on your production agents
          in days, not quarters.
        </p>
        {done ? (
          <div className="max-w-md mx-auto border-gradient rounded-md p-5 font-mono text-sm">
            <span className="text-primary">✓</span> Request received. We'll reach out from{" "}
            <span className="text-primary">minedor@watchmyagents.com</span>.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              placeholder="you@company.com"
              className="flex-1 px-4 py-3 rounded-md bg-input border border-border focus:border-primary focus:outline-none font-mono text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-md font-mono text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition glow-cyan disabled:opacity-60"
            >
              {loading ? "Sending…" : "Request Access"}
            </button>
          </form>
        )}
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
