import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, Shield, Activity, Bot } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import logo from "@/assets/wma-logo.png";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="WatchMyAgents" className="h-9 w-9 rounded-md" />
            <span className="font-display font-bold tracking-wider text-sm">
              WATCH<span className="text-primary">MY</span>AGENTS
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline font-mono">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut().then(() => (window.location.href = "/"))}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
            // Welcome
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Your AI agents. Under protection.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your dashboard is initializing. Agent management coming next.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card icon={Bot} label="Agents" value="0" hint="No agents connected yet" />
          <Card icon={Activity} label="Events 24h" value="—" hint="Awaiting telemetry" />
          <Card icon={Shield} label="Policies" value="0" hint="Draft your first rule" />
        </div>
      </main>
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="relative rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="font-display text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
