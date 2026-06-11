import logo from "@/assets/wma-logo.png";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.97 0.01 240) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.97 0.01 240) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.78 0.18 220 / 0.15), transparent 70%)",
        }}
      />

      <header className="px-6 py-5 border-b border-border/40 backdrop-blur-xl bg-background/60">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <img src={logo} alt="WatchMyAgents" className="h-9 w-9 rounded-md" />
          <span className="font-display font-bold tracking-wider text-sm">
            WATCH<span className="text-primary">MY</span>AGENTS
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="relative">
            <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/20 via-border/40 to-transparent pointer-events-none" />
            <div className="relative bg-card/60 backdrop-blur-xl border border-border/50 rounded-xl p-6 md:p-8">
              {children}
            </div>
          </div>

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>

      <footer className="px-6 py-4 text-xs text-muted-foreground/60 font-mono text-center">
        © {new Date().getFullYear()} WATCHMYAGENTS — CYBERSECURITY FOR AI AGENTS
      </footer>
    </div>
  );
}

export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/50" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-3 text-xs uppercase tracking-widest text-muted-foreground font-mono">
          {children}
        </span>
      </div>
    </div>
  );
}

export function GoogleButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-3 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-foreground text-sm font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {loading ? "Connecting…" : label}
    </button>
  );
}

export function GitHubButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-3 rounded-md border border-border bg-secondary/40 hover:bg-secondary text-foreground text-sm font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
      {loading ? "Connecting…" : label}
    </button>
  );
}
