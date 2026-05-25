import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Workflow, ShieldCheck, Inbox, KeyRound, LogOut, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/wma-logo.png";

type Item = { to: string; label: string; icon: LucideIcon };
const items: Item[] = [
  { to: "/today", label: "Today", icon: Activity },
  { to: "/loop", label: "Loop", icon: Workflow },
  { to: "/policies", label: "Policies", icon: ShieldCheck },
  { to: "/suggestions", label: "Suggestions", icon: Inbox },
  { to: "/settings/keys", label: "Settings", icon: KeyRound },
];

export function FortressShell({ children, title }: { children: ReactNode; title: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const initials = (user?.email ?? "??").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none -z-10" />

      <aside className="hidden md:flex w-60 flex-col border-r border-border/40 bg-background/40 backdrop-blur-xl sticky top-0 h-screen">
        <Link to="/today" className="flex items-center gap-3 px-5 py-5 border-b border-border/40">
          <img src={logo} alt="" className="h-9 w-9 rounded-md" />
          <div className="leading-tight">
            <div className="font-display text-base font-bold tracking-wider">FORTRESS</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              by watchmyagents
            </div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {items.map((it) => {
            const active = path === it.to || (it.to !== "/today" && path.startsWith(it.to));
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}>
                <span
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                    active
                      ? "bg-primary/10 text-foreground border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
                  )}
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  <span className="flex-1">{it.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/40 p-3">
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="h-7 w-7 rounded grid place-items-center bg-gradient-to-br from-primary to-accent text-[11px] font-mono font-bold text-primary-foreground">
              {initials}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{user?.email}</div>
            </div>
            <button
              onClick={() => signOut().then(() => (window.location.href = "/signin"))}
              className="text-muted-foreground hover:text-danger"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl h-14 px-6 flex items-center">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Fortress <span className="text-border">›</span>{" "}
            <span className="text-primary">{title}</span>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
