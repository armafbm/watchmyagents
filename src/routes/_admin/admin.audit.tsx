import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ClipboardList, Search, Download, Clock } from "lucide-react";
import { getAdminAlerts, type AlertEvent } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Logs — WMA Admin" }] }),
  component: AuditLogsPage,
});

const TYPE_CFG: Record<string, { label: string; color: string }> = {
  agent_offline: { label: "AGENT OFFLINE", color: "#FF8C00" },
  deny_spike: { label: "DENY", color: "#FF2D2D" },
  interrupt: { label: "INTERRUPT", color: "#FF8C00" },
  no_enforcement: { label: "NO ENFORCEMENT", color: "#6B7280" },
  key_inactive: { label: "KEY INACTIVE", color: "#6B7280" },
};

const SEV_COLOR: Record<string, string> = {
  critical: "#FF2D2D",
  high: "#FF8C00",
  medium: "#FFD700",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("fr-FR"),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function AuditLogsPage() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSev, setFilterSev] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  useEffect(() => {
    getAdminAlerts().then((e) => { setEvents(e); setLoading(false); });
  }, []);

  const filtered = events.filter((e) => {
    if (filterSev !== "all" && e.severity !== filterSev) return false;
    if (filterType !== "all" && e.type !== filterType) return false;
    const q = search.toLowerCase();
    return !q || e.title.toLowerCase().includes(q) || e.customer_email.toLowerCase().includes(q)
      || (e.agent_name ?? "").toLowerCase().includes(q);
  });

  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const maxPage = Math.ceil(filtered.length / PAGE_SIZE) - 1;

  const handleExport = () => {
    const csv = [
      "timestamp,severity,type,title,detail,customer,agent",
      ...filtered.map((e) =>
        [e.ts, e.severity, e.type, `"${e.title}"`, `"${e.detail}"`, e.customer_email, e.agent_name ?? ""].join(",")
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `wma-audit-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
          <h1 className="text-xl font-semibold text-white">Audit Logs</h1>
          <p className="text-xs text-white/40 mt-0.5">Historique complet des événements Guardian · Décisions · Alertes</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-mono transition-colors">
          <Download className="h-3.5 w-3.5" /> Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher…"
            className="pl-8 pr-4 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/60 text-white placeholder:text-white/30 w-48" />
        </div>
        <select value={filterSev} onChange={(e) => { setFilterSev(e.target.value); setPage(0); }}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 outline-none cursor-pointer">
          <option value="all">Toutes sévérités</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
        </select>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 outline-none cursor-pointer">
          <option value="all">Tous types</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <span className="ml-auto text-[10px] text-white/30 font-mono">{filtered.length} événement(s)</span>
      </div>

      {/* Log Table */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm font-mono">Chargement…</span>
          </div>
        ) : pageEvents.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="h-8 w-8 text-white/10 mx-auto mb-3" />
            <div className="text-sm text-white/30 font-mono">Aucun événement trouvé</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                {["Timestamp", "Sévérité", "Type", "Événement", "Client", "Agent"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-white/30 first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageEvents.map((e, i) => {
                const dt = formatDateTime(e.ts);
                const typeCfg = TYPE_CFG[e.type] ?? { label: e.type, color: "#6B7280" };
                return (
                  <tr key={e.id} className={`hover:bg-white/3 transition-colors font-mono text-xs ${i < pageEvents.length - 1 ? "border-b border-white/5" : ""}`}>
                    <td className="pl-5 pr-4 py-3">
                      <div className="text-white/60 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{dt.time}
                      </div>
                      <div className="text-white/20 text-[10px]">{dt.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-1.5 w-1.5 rounded-full inline-block mr-1.5" style={{ background: SEV_COLOR[e.severity] }} />
                      <span style={{ color: SEV_COLOR[e.severity] }}>{e.severity.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10" style={{ color: typeCfg.color }}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="text-white/80 truncate">{e.title}</div>
                      <div className="text-white/30 text-[10px] truncate">{e.detail}</div>
                    </td>
                    <td className="px-4 py-3 text-blue-400/60 text-[10px] truncate max-w-[140px]">{e.customer_email}</td>
                    <td className="px-4 py-3 pr-5 text-white/40 text-[10px] truncate">{e.agent_name ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30 font-mono">
            Page {page + 1} / {maxPage + 1} · {filtered.length} résultats
          </span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/40 hover:text-white/80 disabled:opacity-30 transition-colors">
              ← Précédent
            </button>
            <button disabled={page >= maxPage} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/40 hover:text-white/80 disabled:opacity-30 transition-colors">
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
