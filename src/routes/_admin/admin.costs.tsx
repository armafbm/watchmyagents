import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, DollarSign, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { getAdminCostCenter, type CostEntry } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/costs")({
  head: () => ({ meta: [{ title: "AI Cost Center — WMA Admin" }] }),
  component: AiCostPage,
});

const RISK_CFG = {
  low: { color: "#00C851", bg: "bg-[#00C851]/10", border: "border-[#00C851]/20", label: "Faible" },
  medium: { color: "#FF8C00", bg: "bg-[#FF8C00]/10", border: "border-[#FF8C00]/20", label: "Moyen" },
  high: { color: "#FF2D2D", bg: "bg-[#FF2D2D]/10", border: "border-[#FF2D2D]/20", label: "Élevé" },
};

function MarginBar({ pct, mrr, cost }: { pct: number; mrr: number; cost: number }) {
  const good = mrr > 0 && pct >= 70;
  const ok = mrr > 0 && pct >= 40;
  const color = mrr === 0 ? "#6B7280" : good ? "#00C851" : ok ? "#FF8C00" : "#FF2D2D";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-white/30">Marge</span>
        <span style={{ color }}>{mrr > 0 ? `${pct}%` : "N/A"}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${mrr > 0 ? pct : 0}%`, background: color }} />
      </div>
    </div>
  );
}

function AiCostPage() {
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"cost" | "margin" | "risk">("cost");
  const [filterRisk, setFilterRisk] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    getAdminCostCenter().then((e) => { setEntries(e); setLoading(false); });
  }, []);

  const filtered = [...entries]
    .filter((e) => filterRisk === "all" || e.risk === filterRisk)
    .sort((a, b) => {
      if (sort === "cost") return b.estimated_cost_usd - a.estimated_cost_usd;
      if (sort === "margin") return a.margin_pct - b.margin_pct;
      const riskOrd: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return riskOrd[a.risk] - riskOrd[b.risk];
    });

  const totals = entries.reduce(
    (acc, e) => ({ cost: acc.cost + e.estimated_cost_usd, mrr: acc.mrr + e.mrr_usd, tokens: acc.tokens + e.estimated_tokens }),
    { cost: 0, mrr: 0, tokens: 0 }
  );
  const globalMargin = totals.mrr > 0 ? Math.round(((totals.mrr - totals.cost) / totals.mrr) * 100) : 0;
  const highRisk = entries.filter((e) => e.risk === "high").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
        <h1 className="text-xl font-semibold text-white">AI Cost Center</h1>
        <p className="text-xs text-white/40 mt-0.5">Coûts IA estimés par client · Marge · Risque financier</p>
      </div>

      {/* KPI Row */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Coût total 30j", value: `$${totals.cost.toFixed(2)}`, color: "#EC4899" },
            { icon: TrendingUp, label: "MRR total", value: `$${totals.mrr.toLocaleString()}`, color: "#00C851" },
            { icon: TrendingDown, label: "Marge globale", value: `${globalMargin}%`, color: globalMargin >= 70 ? "#00C851" : globalMargin >= 40 ? "#FF8C00" : "#FF2D2D" },
            { icon: AlertTriangle, label: "Clients à risque", value: highRisk, color: highRisk > 0 ? "#FF2D2D" : "#6B7280" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-4">
              <div className="flex items-center gap-2 text-white/40 mb-3">
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
              </div>
              <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters & Sort */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-1">
          {(["all", "high", "medium", "low"] as const).map((r) => (
            <button key={r} onClick={() => setFilterRisk(r)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-mono transition-colors ${
                filterRisk === r
                  ? r === "all" ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                    : `${RISK_CFG[r as "high" | "medium" | "low"].bg} ${RISK_CFG[r as "high" | "medium" | "low"].border} text-white`
                  : "border-white/10 text-white/40 hover:text-white/70"
              }`}>
              {r === "all" ? "Tous" : RISK_CFG[r as "high" | "medium" | "low"].label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-mono">Trier par :</span>
          {(["cost", "margin", "risk"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-2 py-1 text-[10px] rounded font-mono transition-colors ${
                sort === s ? "bg-blue-600/20 text-blue-400" : "text-white/30 hover:text-white/60"
              }`}>
              {s === "cost" ? "Coût" : s === "margin" ? "Marge" : "Risque"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm font-mono">Calcul des coûts…</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                {["Client", "Plan", "Décisions 30j", "Tokens estimés", "Coût IA", "MRR", "Marge", "Risque"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-white/30 first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-white/30 text-sm font-mono">Aucun client.</td></tr>
              ) : filtered.map((e, i) => {
                const rsk = RISK_CFG[e.risk];
                return (
                  <tr key={e.customer_id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/5" : ""}`}>
                    <td className="pl-5 pr-4 py-3">
                      <div className="text-white text-sm">{e.customer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">{e.plan}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-white">{e.decisions_30d.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white/50">~{e.estimated_tokens.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-bold text-[#EC4899]">${e.estimated_cost_usd.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-[#00C851]">{e.mrr_usd > 0 ? `$${e.mrr_usd}` : "—"}</span>
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <MarginBar pct={e.margin_pct} mrr={e.mrr_usd} cost={e.estimated_cost_usd} />
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${rsk.bg} ${rsk.border}`}
                        style={{ color: rsk.color }}>{rsk.label}</span>
                    </td>
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
