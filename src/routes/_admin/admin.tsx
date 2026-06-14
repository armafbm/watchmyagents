import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Bot, Activity, Key, Loader2 } from "lucide-react";
import { getAdminMetrics, type AdminMetrics } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin")({
  head: () => ({
    meta: [{ title: "Admin — WatchMyAgents" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminIndexPage,
});

const PLAN_COLORS: Record<string, string> = {
  free: "text-muted-foreground",
  pro: "text-blue-400",
  pro_plus: "text-violet-400",
  business: "text-amber-400",
  advanced: "text-emerald-400",
};

function AdminIndexPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminMetrics().then((m) => {
      setMetrics(m);
      setLoading(false);
    });
  }, []);

  const stats = [
    { label: "Customers", value: metrics?.total_customers, icon: Users },
    { label: "Agents", value: metrics?.total_agents, icon: Bot },
    { label: "Decisions", value: metrics?.total_decisions, icon: Activity },
    { label: "Active Keys", value: metrics?.active_keys, icon: Key },
  ];

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
          Platform
        </div>
        <h1 className="text-xl font-semibold">Metrics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card px-5 py-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Icon className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-3xl font-bold font-mono">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                value ?? 0
              )}
            </div>
          </div>
        ))}
      </div>

      {metrics && Object.keys(metrics.plan_breakdown).length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card px-6 py-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            Plan Breakdown
          </div>
          <div className="flex flex-wrap gap-6">
            {Object.entries(metrics.plan_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([plan, count]) => (
                <div key={plan} className="flex items-baseline gap-2">
                  <span className={`font-mono text-sm font-semibold ${PLAN_COLORS[plan] ?? "text-foreground"}`}>
                    {plan}
                  </span>
                  <span className="text-muted-foreground text-lg font-bold font-mono">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
