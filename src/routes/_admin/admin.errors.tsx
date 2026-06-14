import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, XCircle, AlertOctagon, Clock, Filter } from "lucide-react";
import { getAdminAlerts, type AlertEvent } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/errors")({
  head: () => ({ meta: [{ title: "Error Center — WMA Admin" }] }),
  component: ErrorCenterPage,
});

const SEVERITY_CFG = {
  critical: { color: "#FF2D2D", bg: "bg-[#FF2D2D]/10", border: "border-[#FF2D2D]/20", icon: XCircle, label: "CRITIQUE" },
  high: { color: "#FF8C00", bg: "bg-[#FF8C00]/10", border: "border-[#FF8C00]/20", icon: AlertOctagon, label: "ÉLEVÉ" },
  medium: { color: "#FFD700", bg: "bg-yellow-400/10", border: "border-yellow-400/20", icon: AlertTriangle, label: "MOYEN" },
};

const TYPE_CFG: Record<string, { label: string; desc: string }> = {
  agent_offline: { label: "Agent Offline", desc: "Signal Guardian perdu" },
  deny_spike: { label: "DENY Guardian", desc: "Action bloquée par Guardian" },
  interrupt: { label: "INTERRUPT", desc: "Guardian a interrompu l'agent" },
  no_enforcement: { label: "Sans Enforcement", desc: "Mode monitor uniquement" },
  key_inactive: { label: "Clé inactive", desc: "API key non utilisée" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}j ago`;
}

function ErrorCenterPage() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = () => {
    getAdminAlerts().then((a) => { setAlerts(a); setLoading(false); });
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const filtered = alerts.filter((a) => {
    if (filter !== "all" && a.severity !== filter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    return true;
  });

  const counts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
        <h1 className="text-xl font-semibold text-white">Error Center</h1>
        <p className="text-xs text-white/40 mt-0.5">Toutes les erreurs et anomalies triées par sévérité</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["critical", "high", "medium"] as const).map((sev) => {
          const cfg = SEVERITY_CFG[sev];
          const Icon = cfg.icon;
          return (
            <button key={sev} onClick={() => setFilter(filter === sev ? "all" : sev)}
              className={`rounded-xl border px-5 py-4 text-left transition-all ${
                filter === sev ? `${cfg.bg} ${cfg.border}` : "border-white/8 bg-[#0D0D14] hover:bg-white/3"
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
              <div className="font-mono text-3xl font-bold" style={{ color: cfg.color }}>
                {loading ? "—" : counts[sev]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="h-3.5 w-3.5 text-white/30" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 outline-none cursor-pointer">
          <option value="all">Tous les types</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {filter !== "all" && (
          <button onClick={() => setFilter("all")}
            className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-white/40 hover:text-white/70 transition-colors">
            ✕ Effacer filtre
          </button>
        )}
        <span className="text-xs text-white/30 font-mono ml-auto">
          {loading ? "…" : `${filtered.length} événement(s)`}
        </span>
      </div>

      {/* Error Feed */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-mono">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-sm text-white/40 font-mono">Aucune erreur détectée</div>
            <div className="text-xs text-white/20 mt-1">La plateforme fonctionne normalement</div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((alert) => {
              const sev = SEVERITY_CFG[alert.severity];
              const Icon = sev.icon;
              const typeInfo = TYPE_CFG[alert.type] ?? { label: alert.type, desc: "" };
              return (
                <div key={alert.id} className="px-5 py-4 hover:bg-white/2 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${sev.bg} border ${sev.border}`}>
                      <Icon className="h-3.5 w-3.5" style={{ color: sev.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${sev.bg} ${sev.border}`}
                          style={{ color: sev.color }}>{sev.label}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/10 bg-white/5 text-white/50">
                          {typeInfo.label}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />{timeAgo(alert.ts)}
                        </span>
                      </div>
                      <div className="text-sm text-white font-medium">{alert.title}</div>
                      <div className="text-xs text-white/50 mt-0.5">{alert.detail}</div>
                      <div className="text-[11px] text-blue-400/60 font-mono mt-1">{alert.customer_email}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10px] text-white/20 font-mono">{new Date(alert.ts).toLocaleDateString("fr-FR")}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
