import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, BarChart3, Search, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { getAdminCustomerScores, type CustomerScore } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/scoring")({
  head: () => ({ meta: [{ title: "Client Scoring — WMA Admin" }] }),
  component: ClientScoringPage,
});

const PLAN_LABEL: Record<string, string> = {
  advanced: "Advanced", business: "Business", pro_plus: "Pro+", pro: "Pro", free: "Free",
};

const OVERALL_CFG = {
  healthy: { color: "#00C851", label: "Sain", bg: "bg-[#00C851]/10", border: "border-[#00C851]/20" },
  attention: { color: "#FF8C00", label: "Attention", bg: "bg-[#FF8C00]/10", border: "border-[#FF8C00]/20" },
  critical: { color: "#FF2D2D", label: "Critique", bg: "bg-[#FF2D2D]/10", border: "border-[#FF2D2D]/20" },
};

function ScoreBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-white/30">{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function ClientScoringPage() {
  const [scores, setScores] = useState<CustomerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOverall, setFilterOverall] = useState<"all" | "healthy" | "attention" | "critical">("all");
  const [sort, setSort] = useState<"engagement" | "value" | "risk" | "overall">("risk");

  useEffect(() => {
    getAdminCustomerScores().then((s) => { setScores(s); setLoading(false); });
  }, []);

  const filtered = [...scores]
    .filter((s) => {
      if (filterOverall !== "all" && s.overall !== filterOverall) return false;
      const q = search.toLowerCase();
      return !q || s.email.toLowerCase().includes(q) || (s.display_name ?? "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "engagement") return b.engagement_score - a.engagement_score;
      if (sort === "value") return b.value_score - a.value_score;
      if (sort === "risk") return b.risk_score - a.risk_score;
      const ord: Record<string, number> = { critical: 0, attention: 1, healthy: 2 };
      return ord[a.overall] - ord[b.overall];
    });

  const counts = {
    healthy: scores.filter((s) => s.overall === "healthy").length,
    attention: scores.filter((s) => s.overall === "attention").length,
    critical: scores.filter((s) => s.overall === "critical").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
        <h1 className="text-xl font-semibold text-white">Client Scoring</h1>
        <p className="text-xs text-white/40 mt-0.5">Score d'Engagement · Valeur · Risque — par client</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(["healthy", "attention", "critical"] as const).map((o) => {
          const cfg = OVERALL_CFG[o];
          return (
            <button key={o} onClick={() => setFilterOverall(filterOverall === o ? "all" : o)}
              className={`rounded-xl border px-5 py-4 text-left transition-all ${
                filterOverall === o ? `${cfg.bg} ${cfg.border}` : "border-white/8 bg-[#0D0D14] hover:bg-white/3"
              }`}>
              <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: cfg.color }}>{cfg.label}</div>
              <div className="font-mono text-3xl font-bold" style={{ color: cfg.color }}>
                {loading ? "—" : counts[o]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            className="pl-8 pr-4 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/60 text-white placeholder:text-white/30 w-52" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-mono">Trier :</span>
          {(["risk", "engagement", "value", "overall"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-2 py-1 text-[10px] rounded font-mono transition-colors ${
                sort === s ? "bg-blue-600/20 text-blue-400" : "text-white/30 hover:text-white/60"
              }`}>
              {s === "risk" ? "Risque" : s === "engagement" ? "Engagement" : s === "value" ? "Valeur" : "Statut"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm font-mono">Calcul des scores…</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                {["Client", "Plan", "Engagement", "Valeur", "Risque", "Statut", "Raison"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-white/30 first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-white/30 text-sm font-mono">Aucun client trouvé.</td></tr>
              ) : filtered.map((s, i) => {
                const cfg = OVERALL_CFG[s.overall];
                return (
                  <tr key={s.id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/5" : ""}`}>
                    <td className="pl-5 pr-4 py-3">
                      <div className="text-white text-sm">{s.display_name ?? s.email}</div>
                      <div className="text-[10px] text-white/30 font-mono">{s.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                        {PLAN_LABEL[s.plan] ?? s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <ScoreBar value={s.engagement_score} color="#0066FF" label="" />
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <ScoreBar value={s.value_score} color="#00C851" label="" />
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <ScoreBar value={s.risk_score} color={s.risk_score >= 60 ? "#FF2D2D" : s.risk_score >= 30 ? "#FF8C00" : "#6B7280"} label="" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border}`}
                        style={{ color: cfg.color }}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 pr-5 text-[10px] text-white/40 max-w-[180px] truncate">{s.risk_reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
