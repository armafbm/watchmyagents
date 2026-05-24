import { Link, useRouterState } from "@tanstack/react-router";
import {
  Castle,
  Eye,
  Shield,
  Brain,
  Search,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/wma-logo.png";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  soon?: boolean;
};

const opsNav: NavItem[] = [
  { to: "/dashboard", label: "Command Center", icon: Castle },
];
const operations: NavItem[] = [
  { to: "/dashboard/watch", label: "Watch · Monitoring", icon: Eye },
  { to: "/dashboard/shield", label: "Shield · Defense", icon: Shield, badge: 1 },
  { to: "/dashboard/guardian", label: "Guardian AI", icon: Brain },
];

export function DashboardLayout({
  children,
  breadcrumb,
}: {
  children: ReactNode;
  breadcrumb: string;
}) {
  const { user, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (user?.email ?? "??").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Ambient bg */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none -z-10" />
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.55 0.22 270 / 0.15), transparent 60%)",
        }}
      />

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-background/40 backdrop-blur-xl sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-5 border-b border-border/40">
          <div className="relative">
            <img src={logo} alt="" className="h-10 w-10 rounded-md" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background animate-blink" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold tracking-wider">
              FORTRESS
            </div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              by watchmyagents
            </div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <NavGroup label="Fortress" items={opsNav} current={path} />
          <NavGroup label="Operations" items={operations} current={path} />
          <NavGroup label="Intelligence" items={intelligence} current={path} />
        </nav>

        <div className="border-t border-border/40 p-4">
          <div className="rounded-lg border border-border/50 bg-card/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Fleet status
              </span>
            </div>
            <div className="font-display text-sm font-bold text-success">SECURE</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-1">
              24 agents · 7 fleets
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
          <div className="h-16 px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground min-w-0">
              <span className="hidden sm:inline">Fortress</span>
              <span className="hidden sm:inline text-border">›</span>
              <span className="text-primary truncate">{breadcrumb}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="hidden md:flex items-center gap-2 px-3 h-9 rounded-md border border-border/60 bg-card/40 text-xs text-muted-foreground hover:border-primary/60 transition">
                <Search className="h-3.5 w-3.5" />
                <span>Search agents, signals…</span>
                <kbd className="ml-6 font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary/60 border border-border">
                  ⌘K
                </kbd>
              </button>
              <IconBtn>
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger animate-blink" />
              </IconBtn>
              <IconBtn>
                <Settings className="h-4 w-4" />
              </IconBtn>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-md border border-border/60 bg-card/40 hover:border-primary/60 transition"
                >
                  <span className="h-7 w-7 rounded grid place-items-center bg-gradient-to-br from-primary to-accent text-[11px] font-mono font-bold text-primary-foreground">
                    {initials}
                  </span>
                  <div className="hidden lg:block text-left leading-tight">
                    <div className="text-xs font-semibold truncate max-w-[120px]">
                      {user?.email?.split("@")[0]}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      Fortress admin
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover/95 backdrop-blur-xl shadow-xl py-1.5 text-sm">
                    <div className="px-3 py-2 border-b border-border/60">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Signed in as
                      </div>
                      <div className="truncate">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => signOut().then(() => (window.location.href = "/"))}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/60 text-left text-danger"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  items,
  current,
}: {
  label: string;
  items: NavItem[];
  current: string;
}) {
  return (
    <div>
      <div className="px-3 mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
        {label}
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = current === item.to;
          const Icon = item.icon;
          const content = (
            <span
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                active
                  ? "bg-primary/10 text-foreground border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
              } ${item.soon ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
              )}
              <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-danger/20 text-danger">
                  {item.badge}
                </span>
              )}
              {item.soon && (
                <span className="font-mono text-[9px] tracking-widest text-muted-foreground/60">
                  SOON
                </span>
              )}
            </span>
          );
          return (
            <li key={item.label}>
              {item.soon ? (
                content
              ) : (
                <Link to={item.to}>{content}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IconBtn({ children }: { children: ReactNode }) {
  return (
    <button className="relative h-9 w-9 grid place-items-center rounded-md border border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/60 transition">
      {children}
    </button>
  );
}
