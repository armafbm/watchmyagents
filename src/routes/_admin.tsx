import { createFileRoute, redirect, Outlet, Link, useRouterState } from "@tanstack/react-router";
import {
  Shield, LayoutDashboard, Heart, Bot, Dna, Radio,
  AlertTriangle, DollarSign, TrendingUp, BarChart3, ClipboardList, Settings, KeyRound,
  ChevronRight,
} from "lucide-react";
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
  { to: "/admin", label: "Mission Control", icon: LayoutDashboard, exact: true },
  { to: "/admin/health", label: "Health Center", icon: Heart, exact: false },
  { to: "/admin/agents", label: "Agent Monitor", icon: Bot, exact: false },
  { to: "/admin/guardian", label: "Guardian Command", icon: Dna, exact: false },
  { to: "/admin/monitoring", label: "Platform Monitor", icon: Radio, exact: false },
  { to: "/admin/errors", label: "Error Center", icon: AlertTriangle, exact: false },
  { to: "/admin/costs", label: "AI Cost Center", icon: DollarSign, exact: false },
  { to: "/admin/revenue", label: "Revenue Center", icon: TrendingUp, exact: false },
  { to: "/admin/scoring", label: "Client Scoring", icon: BarChart3, exact: false },
  { to: "/admin/audit", label: "Audit Logs", icon: ClipboardList, exact: false },
  { to: "/admin/signing-keys", label: "Signing Keys", icon: KeyRound, exact: false },
  { to: "/admin/config", label: "Super Admin", icon: Settings, exact: false },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex text-white">
      <aside className="w-56 shrink-0 border-r border-white/5 flex flex-col bg-[#0D0D14]">
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-blue-400">
              WMA Admin
            </span>
          </div>
          <div className="text-[10px] text-white/30 font-mono pl-8">SOC · Mission Control</div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === to || pathname === to + "/"
              : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/5">
          <Link to="/dashboard" className="text-[11px] text-white/30 hover:text-white/60 transition-colors font-mono">
            ← App
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#0A0A0F]">
        <Outlet />
      </main>
    </div>
  );
}
