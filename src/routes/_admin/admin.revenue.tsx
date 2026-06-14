import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react";
import { getAdminMetrics, getAdminHealthCenter, type AdminMetrics, type CustomerHealth } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/revenue")({
  head: () => ({ meta: [{ title: "Revenue Center — WMA Admin" }] }),
  component: RevenueCenterPage,
});

const PLAN_ORDER = ["advanced", "business", "pro_plus", "pro", "free"];
const PLAN_LABEL: Record<string, string> = {
  advanced: "Advanced", business: "Business", pro_plus: "Pro+", pro: "Pro", free: "Free",
};
const PLAN_MRR: Record<string, number> = { free: 0, pro: 49, pro_plus: 99, business: 299, advanced: 999 };
const PLAN_COLOR: Record<string, string> = {
  advanced: "#10B981", business: "#F59E0B", pro_plus: "#8B5CF6", pro: "#3B82F6", free: "#6B7280",
};

function RevenueCenterPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [customers, setCustomers] = useState<CustomerHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminMetrics(), getAdminHealthCenter()]).then(([m, c]) => {
      setMetrics(m); setCustomers(c); setLoading(false);
    });
  }, []);

  const planBreakdown = metrics?.plan_breakdown ?? {};
  const totalMRR = metrics?.mrr_estimate ?? 0;
  const totalARR = totalMRR * 12;
  const totalCost = customers.reduce((a, c) => a + c.cost_estimate_usd, 0);
  const globalMargin = totalMRR > 0 ? Math.round(((totalMRR - totalCost) / totalMRR) * 100) : 0;

  const payingCustomers = customers.filter((c) => c.mrr_usd > 0);
  const avgRevenuePerUser = payingCustomers.length > 0
    ? Math.round(payingCustomers.reduce((a, c) => a + c.mrr_usd, 0) / payingCustomers.length)
    : 0;

  const topCustomers = [...customers]
    .filter((c) => c.mrr_usd > 0)
    .sort((a, b) => b.mrr_usd - a.mrr_usd)
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
        <h1 className="text-xl font-semibold text-white">Revenue Center</h1>
        <p className="text-xs text-white/40 mt-0.5">MRR · ARR · Marge · Plans · Top clients par valeur</p>
      </div>

      {/* KPI Row */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, label: "MRR estimé", value: `$${totalMRR.toLocaleString()}`, sub: "Récurrent mensuel", color: "#00C851" },
              { icon: BarChart3, label: "ARR estimé", value: `$${totalARR.toLocaleString()}`, sub: "Projection annuelle", color: "#0066FF" },
              { icon: Users, label: "ARPU payants", value: `$${avgRevenuePerUser}`, sub: `${payingCustomers.length} clients payants`, color: "#8B5CF6" },
              { icon: DollarSign, label: "Marge globale", value: `${globalMargin}%`, sub: `Coût IA : $${totalCost.toFixed(2)}/mois`, color: globalMargin >= 70 ? "#00C851" : globalMargin >= 40 ? "#FF8C00" : "#FF2D2D" },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-4">
                <div className="flex items-center gap-2 text-white/40 mb-3">
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                  <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
                </div>
                <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
                <div className="text-[10px] text-white/30 mt-1 font-mono">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Plan Breakdown */}
            <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4">Répartition par Plan</div>
              <div className="space-y-4">
                {PLAN_ORDER.map((plan) => {
                  const count = planBreakdown[plan] ?? 0;
                  const total = Math.max(metrics?.total_customers ?? 1, 1);
                  const pct = Math.round((count / total) * 100);
                  const mrr = PLAN_MRR[plan] ?? 0;
                  const color = PLAN_COLOR[plan];
                  return (
                    <div key={plan} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                          <span style={{ color }}>{PLAN_LABEL[plan]}</span>
                          <span className="text-white/30">{count} client{count > 1 ? "s" : ""}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white/60">${(count * mrr).toLocaleString()}/mois</span>
                          <span className="text-white/30 ml-2">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Customers */}
            <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4">Top Clients par Valeur</div>
              {topCustomers.length === 0 ? (
                <div className="text-sm text-white/30 font-mono text-center py-8">Aucun client payant</div>
              ) : (
                <div className="space-y-3">
                  {topCustomers.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="font-mono text-sm text-white/20 w-5 text-right">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate">{c.email}</div>
                        <div className="text-[10px] text-white/30 font-mono">{PLAN_LABEL[c.plan]} · {c.agent_count} agent{c.agent_count > 1 ? "s" : ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-[#00C851]">${c.mrr_usd}/mo</div>
                        <div className="text-[10px] text-white/30 font-mono">M: {c.margin_pct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Revenue by Health */}
          <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4">MRR par État de Santé Client</div>
            <div className="grid grid-cols-3 gap-4">
              {(["healthy", "warning", "critical"] as const).map((h) => {
                const group = customers.filter((c) => c.health === h);
                const mrr = group.reduce((a, c) => a + c.mrr_usd, 0);
                const color = h === "healthy" ? "#00C851" : h === "warning" ? "#FF8C00" : "#FF2D2D";
                const label = h === "healthy" ? "Sains" : h === "warning" ? "À risque" : "Critiques";
                return (
                  <div key={h} className="text-center rounded-lg bg-white/3 px-4 py-4">
                    <div className="font-mono text-xl font-bold" style={{ color }}>${mrr.toLocaleString()}</div>
                    <div className="text-xs text-white/40 mt-1">{label}</div>
                    <div className="text-[10px] text-white/20 mt-0.5 font-mono">{group.length} clients</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
