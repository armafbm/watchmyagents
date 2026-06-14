import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search, ChevronDown, X, Shield, AlertTriangle, CheckCircle2, TrendingUp, Bot, Key, FileText } from "lucide-react";
import { toast } from "sonner";
import { getAdminHealthCenter, updateUserPlan, type CustomerHealth } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/health")({
  head: () => ({ meta: [{ title: "Health Center — WMA Admin" }] }),
  component: HealthCenterPage,
});

const PLANS = ["free", "pro", "pro_plus", "business", "advanced"];
const PLAN_COLOR: Record<string, string> = { free: "#6B7280", pro: "#3B82F6", pro_plus: "#8B5CF6", business: "#F59E0B", advanced: "#10B981" };
const HEALTH_CONFIG = {
  healthy: { color: "#00C851", bg: "bg-[#00C851]/10", border: "border-[#00C851]/20", label: "Sain" },
  warning: { color: "#FF8C00", bg: "bg-[#FF8C00]/10", border: "border-[#FF8C00]/20", label: "⚠ Attention" },
  critical: { color: "#FF2D2D", bg: "bg-[#FF2D2D]/10", border: "border-[#FF2D2D]/20", label: "🔴 Critique" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function ScoreBadge({ score, health }: { score: number; health: CustomerHealth["health"] }) {
  const c = HEALTH_CONFIG[health];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${c.bg} ${c.border}`} style={{ color: c.color }}>
      {score}
    </div>
  );
}

function HealthBar({ healthy, warning, critical }: { healthy: number; warning: number; critical: number }) {
  const total = Math.max(healthy + warning + critical, 1);
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-px w-16">
      <div style={{ width: `${(healthy / total) * 100}%` }} className="h-full bg-[#00C851]" />
      <div style={{ width: `${(warning / total) * 100}%` }} className="h-full bg-[#FF8C00]" />
      <div style={{ width: `${(critical / total) * 100}%` }} className="h-full bg-[#FF2D2D]" />
    </div>
  );
}

function ClientSheet({ client, onClose, onPlanChange }: { client: CustomerHealth; onClose: () => void; onPlanChange: (id: string, plan: string) => void }) {
  const [updating, setUpdating] = useState(false);
  const hc = HEALTH_CONFIG[client.health];

  const changePlan = async (plan: string) => {
    setUpdating(true);
    try {
      await updateUserPlan({ data: { customerId: client.id, plan } });
      onPlanChange(client.id, plan);
      toast.success("Plan mis à jour");
    } catch { toast.error("Erreur"); }
    finally { setUpdating(false); }
  };

  const immune = [
    { label: "Disponibilité", value: client.agents_healthy > 0 ? Math.round((client.agents_healthy / Math.max(client.agent_count, 1)) * 100) : (client.agent_count === 0 ? 0 : 20), color: "#00C851" },
    { label: "Performance", value: client.decisions_7d > 0 ? 85 : 40, color: "#0066FF" },
    { label: "Couverture", value: client.policy_count > 0 ? 90 : 30, color: "#8B5CF6" },
    { label: "Activité", value: client.decisions_7d > 10 ? 95 : client.decisions_7d > 0 ? 60 : 20, color: "#F59E0B" },
    { label: "Maîtrise coût", value: client.margin_pct, color: "#10B981" },
  ];

  const risks: string[] = [];
  if (client.agents_critical > 0) risks.push(`${client.agents_critical} agent(s) hors-ligne`);
  if (client.policy_count === 0) risks.push("Aucune politique Guardian active");
  if (client.decisions_7d === 0) risks.push("Inactivité détectée (7j)");
  if (client.active_keys === 0) risks.push("Aucune clé API active");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[#0D0D14] border-l border-white/8 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#0D0D14] border-b border-white/8 px-6 py-4 flex items-start justify-between">
          <div>
            <div className="text-white font-semibold">{client.display_name ?? client.email}</div>
            <div className="text-xs text-white/40 font-mono mt-0.5">{client.email}</div>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge score={client.health_score} health={client.health} />
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Immune System */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
              <Shield className="h-3 w-3" /> Système Immunitaire
            </div>
            <div className="space-y-2">
              {immune.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-white/50">{item.label}</div>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                  <div className="w-10 text-right text-xs font-mono" style={{ color: item.color }}>{item.value}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          {risks.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF2D2D]/60 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" /> Risques Détectés
              </div>
              <div className="space-y-1">
                {risks.map((r) => (
                  <div key={r} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="text-[#FF2D2D] mt-0.5">→</span> {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Bot, label: "Agents", value: client.agent_count },
              { icon: Key, label: "Clés actives", value: client.active_keys },
              { icon: FileText, label: "Politiques", value: client.policy_count },
              { icon: TrendingUp, label: "Décisions 7j", value: client.decisions_7d },
              { icon: TrendingUp, label: "Décisions 30j", value: client.decisions_30d },
              { icon: Shield, label: "Marge", value: `${client.margin_pct}%` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/3 rounded-lg px-3 py-3">
                <Icon className="h-3 w-3 text-white/30 mb-1" />
                <div className="text-sm font-mono font-bold text-white">{value}</div>
                <div className="text-[10px] text-white/40">{label}</div>
              </div>
            ))}
          </div>

          {/* Plan + Financial */}
          <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">Abonnement & Finances</div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-white/50">Plan actuel</span>
              <select
                value={client.plan}
                disabled={updating}
                onChange={(e) => changePlan(e.target.value)}
                className="font-mono text-xs border border-white/10 rounded px-2 py-1 bg-transparent cursor-pointer disabled:opacity-50"
                style={{ color: PLAN_COLOR[client.plan] ?? "#fff" }}
              >
                {PLANS.map((p) => <option key={p} value={p} className="bg-[#0D0D14]">{p}</option>)}
              </select>
              {updating && <Loader2 className="h-3 w-3 animate-spin text-white/30" />}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-mono font-bold text-[#00C851]">${client.mrr_usd}</div>
                <div className="text-[10px] text-white/40">MRR</div>
              </div>
              <div>
                <div className="text-sm font-mono font-bold text-[#FF8C00]">${client.cost_estimate_usd.toFixed(2)}</div>
                <div className="text-[10px] text-white/40">Coût IA 30j</div>
              </div>
              <div>
                <div className="text-sm font-mono font-bold" style={{ color: client.margin_pct > 50 ? "#00C851" : "#FF8C00" }}>
                  {client.margin_pct}%
                </div>
                <div className="text-[10px] text-white/40">Marge</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">Actions Admin</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Ajouter crédits", color: "#0066FF" },
                { label: "Suspendre", color: "#FF8C00" },
                { label: "Supprimer", color: "#FF2D2D" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => toast.info(`${a.label} — Coming soon`)}
                  className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-white/5"
                  style={{ borderColor: `${a.color}30`, color: a.color }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-white/20 font-mono">
            Inscrit le {new Date(client.created_at).toLocaleDateString("fr-FR")} · Dernière activité {timeAgo(client.last_active)}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthCenterPage() {
  const [clients, setClients] = useState<CustomerHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [selected, setSelected] = useState<CustomerHealth | null>(null);

  useEffect(() => {
    getAdminHealthCenter().then((c) => { setClients(c); setLoading(false); });
  }, []);

  const handlePlanChange = (id: string, plan: string) => {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, plan } : c));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, plan } : prev);
  };

  const filtered = clients.filter((c) => {
    if (filterHealth !== "all" && c.health !== filterHealth) return false;
    if (filterPlan !== "all" && c.plan !== filterPlan) return false;
    const q = search.toLowerCase();
    return !q || c.email.toLowerCase().includes(q) || (c.display_name ?? "").toLowerCase().includes(q);
  });

  const stats = {
    healthy: clients.filter(c => c.health === "healthy").length,
    warning: clients.filter(c => c.health === "warning").length,
    critical: clients.filter(c => c.health === "critical").length,
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
          <h1 className="text-xl font-semibold text-white">Health Center</h1>
          <p className="text-xs text-white/40 mt-0.5">Score de santé calculé en temps réel par Guardian</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Sains", count: stats.healthy, color: "#00C851" },
            { label: "Attention", count: stats.warning, color: "#FF8C00" },
            { label: "Critiques", count: stats.critical, color: "#FF2D2D" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-white/8 bg-[#0D0D14] px-3 py-2 text-center min-w-[60px]">
              <div className="font-mono text-lg font-bold" style={{ color: s.color }}>{loading ? "—" : s.count}</div>
              <div className="text-[10px] text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            className="pl-8 pr-4 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/60 text-white placeholder:text-white/30 w-52"
          />
        </div>
        <select value={filterHealth} onChange={(e) => setFilterHealth(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 outline-none cursor-pointer">
          <option value="all">Tous les états</option>
          <option value="healthy">🟢 Sain</option>
          <option value="warning">🟡 Attention</option>
          <option value="critical">🔴 Critique</option>
        </select>
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 outline-none cursor-pointer">
          <option value="all">Tous les plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-mono">Chargement…</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                {["Client", "Score", "Plan", "Agents", "Décisions 7j", "Coût 30j", "Marge", "Dernière activité", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-white/30 first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm text-white/30 font-mono">Aucun client trouvé.</td></tr>
              ) : filtered.map((c, i) => {
                const hc = HEALTH_CONFIG[c.health];
                return (
                  <tr key={c.id}
                    onClick={() => setSelected(c)}
                    className={`hover:bg-white/3 cursor-pointer transition-colors ${i < filtered.length - 1 ? "border-b border-white/5" : ""}`}
                  >
                    <td className="pl-5 pr-4 py-3">
                      <div className="text-white font-medium text-sm">{c.display_name ?? "—"}</div>
                      <div className="text-[11px] text-white/40 font-mono">{c.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={c.health_score} health={c.health} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs" style={{ color: PLAN_COLOR[c.plan] }}>{c.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-sm text-white">{c.agent_count}</span>
                        {c.agent_count > 0 && <HealthBar healthy={c.agents_healthy} warning={c.agents_warning} critical={c.agents_critical} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-white/80">{c.decisions_7d}</td>
                    <td className="px-4 py-3 font-mono text-sm text-white/80">${c.cost_estimate_usd.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm" style={{ color: c.margin_pct > 50 ? "#00C851" : c.mrr_usd === 0 ? "#6B7280" : "#FF8C00" }}>
                        {c.mrr_usd === 0 ? "—" : `${c.margin_pct}%`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40 font-mono">{timeAgo(c.last_active)}</td>
                    <td className="pr-5 py-3 text-right">
                      <ChevronDown className="h-3.5 w-3.5 text-white/20 -rotate-90 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <ClientSheet client={selected} onClose={() => setSelected(null)} onPlanChange={handlePlanChange} />
      )}
    </div>
  );
}
