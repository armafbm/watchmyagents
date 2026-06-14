import { createFileRoute, redirect, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Shield, Users, LayoutDashboard, Key, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "arma@watchmyagents.com";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) { window.location.assign("/auth/signin"); return; }
    if (data.user.email !== ADMIN_EMAIL) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  { to: "/admin/operator", label: "API Keys", icon: Key, exact: false },
  { to: "/admin/signing-keys", label: "Signing Keys", icon: ShieldCheck, exact: false },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-52 shrink-0 border-r border-border/60 flex flex-col">
        <div className="px-5 py-5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs font-semibold tracking-widest uppercase text-primary">
              Admin
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
            WatchMyAgents Fortress
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border/60">
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to app
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
