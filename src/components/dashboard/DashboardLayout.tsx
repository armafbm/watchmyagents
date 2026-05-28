import { Link, useRouterState } from "@tanstack/react-router";
import {
  Castle,
  Shield,
  FileText,
  Radar,
  ScrollText,
  Search,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Swords,
  KeyRound,
  Home,
  type LucideIcon,
} from "lucide-react";
import { GuardianChatWidget } from "@/components/dashboard/GuardianChatWidget";
import { useEffect, useState, type ReactNode, type ComponentType } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/fortress-logo.png";
import legionsImg from "@/assets/wma-legions.png";
import { LayerIcon, type LayerKey } from "@/components/site/LayerIcons";

const makeLayerIcon = (layer: LayerKey): ComponentType<{ className?: string }> =>
  ({ className }) => <LayerIcon layer={layer} className={className ?? "h-4 w-4"} />;
const WatchAvatar = makeLayerIcon("watch");
const GuardianAvatar = makeLayerIcon("guardian");
const ShieldAvatar = makeLayerIcon("shield");
const LegionsAvatar: ComponentType<{ className?: string }> = ({ className }) => (
  <img src={legionsImg} alt="" className={`object-contain shrink-0 ${className ?? "h-4 w-4"}`} />
);

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  soon?: boolean;
};

const commandChildren: NavItem[] = [
  { to: "/dashboard/reports", label: "Reports & Audit", icon: FileText },
  { to: "/dashboard/settings/keys", label: "API Keys", icon: KeyRound },
  { to: "#", label: "Compliance & Conformity", icon: ScrollText, soon: true },
  { to: "#", label: "Threat Intel", icon: Radar, soon: true },
];
const baseOperations: Omit<NavItem, "badge">[] = [
  { to: "/dashboard/watch", label: "Watch · Monitoring", icon: WatchAvatar as unknown as LucideIcon },
  { to: "/dashboard/guardian", label: "Guardian AI", icon: GuardianAvatar as unknown as LucideIcon },
  
  { to: "/dashboard/shield", label: "Shield · Policies", icon: ShieldAvatar as unknown as LucideIcon },
  { to: "/dashboard/legions", label: "Legions · Fleets", icon: LegionsAvatar as unknown as LucideIcon },
];

function useNotificationCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ shield: 0, total: 0 });

  useEffect(() => {
    if (!user) {
      setCounts({ shield: 0, total: 0 });
      return;
    }
    let cancelled = false;

    const load = async () => {
      const { count } = await supabase
        .from("suggestions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (cancelled) return;
      const shield = count ?? 0;
      setCounts({ shield, total: shield });
    };

    load();
    const channel = supabase
      .channel(`notif-suggestions:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "suggestions", filter: `customer_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return counts;
}


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
  const notif = useNotificationCounts();
  const operations: NavItem[] = baseOperations.map((item) =>
    item.to === "/dashboard/shield" && notif.shield > 0
      ? { ...item, badge: notif.shield }
      : item
  );

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
          <CommandNav current={path} children={commandChildren} />
          <NavGroup label="Operations" items={operations} current={path} />
        </nav>

        <div className="px-3 pb-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Back to site</span>
          </Link>
        </div>

        <div className="border-t border-border/40 p-4">
          <FleetStatusCard />
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
                {notif.total > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-danger text-[9px] font-mono font-bold text-danger-foreground grid place-items-center ring-2 ring-background">
                    {notif.total > 9 ? "9+" : notif.total}
                  </span>
                )}
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

      {/* Floating Guardian Chat widget */}
      <GuardianChatWidget />
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

function CommandNav({ current, children }: { current: string; children: NavItem[] }) {
  const isCommandActive = current === "/dashboard";
  const childActive = children.some((c) => !c.soon && current === c.to);
  const [open, setOpen] = useState(isCommandActive || childActive);

  useEffect(() => {
    if (isCommandActive || childActive) setOpen(true);
  }, [isCommandActive, childActive]);

  return (
    <div>
      <div className="px-3 mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
        Fortress
      </div>
      <ul className="space-y-1">
        <li>
          <div className="flex items-stretch gap-1">
            <Link to="/dashboard" className="flex-1">
              <span
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                  isCommandActive
                    ? "bg-primary/10 text-foreground border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
                }`}
              >
                {isCommandActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
                )}
                <Castle className={`h-4 w-4 ${isCommandActive ? "text-primary" : ""}`} />
                <span className="flex-1 truncate">Command Center</span>
              </span>
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Collapse" : "Expand"}
              aria-expanded={open}
              className="px-2 rounded-md border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition"
            >
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div
            className={`grid transition-all duration-300 ease-out ${
              open ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <ul className="overflow-hidden ml-3 pl-3 border-l border-border/40 space-y-1">
              {children.map((item) => {
                const active = !item.soon && current === item.to;
                const Icon = item.icon;
                const inner = (
                  <span
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition ${
                      active
                        ? "bg-primary/10 text-foreground border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
                    } ${item.soon ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : ""}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.soon && (
                      <span className="font-mono text-[9px] tracking-widest text-muted-foreground/60">
                        SOON
                      </span>
                    )}
                  </span>
                );
                return (
                  <li key={item.label} className="pt-1 first:pt-1">
                    {item.soon ? inner : <Link to={item.to}>{inner}</Link>}
                  </li>
                );
              })}
            </ul>
          </div>
        </li>
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

function FleetStatusCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ total: number; active: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id,status");
      if (cancelled || error || !data) return;
      const total = data.length;
      const active = data.filter((a) => a.status === "active").length;
      setStats({ total, active });
    };
    load();

    const channel = supabase
      .channel(`fleet-status-agents:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents", filter: `customer_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const isSecure = total > 0 && active === total;
  const isEmpty = total === 0;
  const label = isEmpty ? "NO AGENTS" : isSecure ? "SECURE" : "DEGRADED";
  const tone = isEmpty
    ? "text-muted-foreground"
    : isSecure
    ? "text-success"
    : "text-warning";

  return (
    <div className="rounded-lg border border-border/50 bg-card/40 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Shield className={`h-3.5 w-3.5 ${tone}`} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Fleet status
        </span>
      </div>
      <div className={`font-display text-sm font-bold ${tone}`}>
        {stats ? label : "…"}
      </div>
      <div className="font-mono text-[10px] text-muted-foreground mt-1">
        {stats ? `${total} agent${total === 1 ? "" : "s"} · ${active} active` : "loading…"}
      </div>
    </div>
  );
}
