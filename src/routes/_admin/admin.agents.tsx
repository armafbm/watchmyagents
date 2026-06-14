import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search, X, Activity, CheckCircle2, XCircle, AlertOctagon } from "lucide-react";
import { getAdminAgentMonitor, type AdminAgent } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/agents")({
  head: () => ({ meta: [{ title: "Agent Monitor — WMA Admin" }] }),
  component: AgentMonitorPage,
});

const HEALTH_CFG = {
  healthy: { color: "#00C851", label: "Healthy", icon: CheckCircle2 },
  warning: { color: "#FF8C00", label: "Warning", icon: AlertOctagon },
  critical: { color: "#FF2D2D", label: "Critical", icon: XCircle },
};

const PROVIDER_LABEL: Record<string, string> = {
  "anthropic-managed": "Anthropic",
  "openai-agents": "OpenAI",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "jamais";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

function AgentSheet({ agent, onClose }: { agent: AdminAgent; onClose: () => void }) {
  const hc = HEALTH_CFG[agent.health];
  const Icon = hc.icon;
  const total = Math.max(agent.decisions_total, 1);
  const allowPct = Math.round((agent.allow_count / total) * 100);
  const denyPct = Math.round((agent.deny_count / total) * 100);
  const interruptPct = Math.round((agent.interrupt_count / total) * 100);

  const diagnostics: string[] = [];
  if (agent.health === "critical") diagnostics.push("Signal Guardian absent — agent potentiellement hors ligne");
  if (agent.deny_count > agent.allow_count * 0.3) diagnostics.push(`Taux de DENY élevé (${denyPct}%) — réviser les politiques`);
  if (agent.policy_count === 0) diagnostics.push("Aucune politique Guardian — agent non protégé");
  if (agent.decisions_7d === 0 && agent.decisions_total > 0) diagnostics.push("Inactivité 7 jours — agent en veille ou abandonné");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#0D0D14] border-l border-white/8 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#0D0D14] border-b border-white/8 px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" style={{ color: hc.color }} />
                <span className="text-white font-semibold">{agent.display_name ?? agent.native_agent_id}</span>
              </div>
              <div className="text-[11px] text-white/40 font-mono">{agent.customer_email}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded-full border"
                style={{ color: hc.color, borderColor: `${hc.color}30`, background: `${hc.color}10` }}>
                {hc.label}
              </span>
              <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Health Score */}
          <div className="rounded-lg border border-white/8 px-4 py-3 bg-white/3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Score de santé</span>
              <span className="font-mono text-2xl font-bold" style={{ color: hc.color }}>{agent.health_score}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${agent.health_score}%`, background: hc.color }} />
            </div>
            {agent.last_seen_at && (
              <div className="text-[10px] text-white/30 mt-2 font-mono">
                Dernier signal Guardian : il y a {timeAgo(agent.last_seen_at)}
              </div>
            )}
          </div>

          {/* Diagnostics */}
          {diagnostics.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF2D2D]/60 mb-2">Diagnostic Guardian</div>
              <div className="space-y-1.5">
                {diagnostics.map((d) => (
                  <div key={d} className="flex gap-2 text-xs text-white/60 bg-[#FF2D2D]/5 rounded px-3 py-2 border border-[#FF2D2D]/10">
                    <span className="text-[#FF2D2D] shrink-0">→</span> {d}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Breakdown */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">Décisions Guardian</div>
            <div className="flex h-3 rounded-full overflow-hidden gap-px mb-2">
              {allowPct > 0 && <div style={{ width: `${allowPct}%` }} className="h-full bg-[#00C851]" />}
              {denyPct > 0 && <div style={{ width: `${denyPct}%` }} className="h-full bg-[#FF2D2D]" />}
              {interruptPct > 0 && <div style={{ width: `${interruptPct}%` }} className="h-full bg-[#FF8C00]" />}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "ALLOW", count: agent.allow_count, pct: allowPct, color: "#00C851" },
                { label: "DENY", count: agent.deny_count, pct: denyPct, color: "#FF2D2D" },
                { label: "INTERRUPT", count: agent.interrupt_count, pct: interruptPct, color: "#FF8C00" },
              ].map((s) => (
                <div key={s.label} className="bg-white/3 rounded-lg px-3 py-2 text-center">
                  <div className="font-mono text-sm font-bold" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-[10px] text-white/40">{s.label} ({s.pct}%)</div>
                </div>
              ))}
            </div>
          </div>

          {/* Config */}
          <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-4 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Configuration</div>
            {[
              { label: "ID natif", value: agent.native_agent_id },
              { label: "Provider", value: PROVIDER_LABEL[agent.provider] ?? agent.provider },
              { label: "Type", value: agent.agent_type ?? "standard" },
              { label: "Statut", value: agent.status },
              { label: "Politiques actives", value: `${agent.policy_count}` },
              { label: "Décisions total", value: `${agent.decisions_total}` },
              { label: "Décisions 7j", value: `${agent.decisions_7d}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-white/40">{label}</span>
                <span className="font-mono text-white/80">{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">Actions Admin</div>
            <div className="flex flex-wrap gap-2">
              {["Pause agent", "Redémarrer", "Rollback config", "Forcer reconnexion", "Supprimer"].map((a, i) => (
                <button key={a}
                  onClick={() => alert(`${a} — Coming soon (nécessite Guardian API)`)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:bg-white/5 transition-colors">
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentMonitorPage() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [selected, setSelected] = useState<AdminAgent | null>(null);

  useEffect(() => {
    getAdminAgentMonitor().then((a) => { setAgents(a); setLoading(false); });
  }, []);

  const filtered = agents.filter((a) => {
    if (filterHealth !== "all" && a.health !== filterHealth) return false;
    if (filterProvider !== "all" && a.provider !== filterProvider) return false;
    const q = search.toLowerCase();
    return !q || (a.display_name ?? "").toLowerCase().includes(q)
      || a.native_agent_id.toLowerCase().includes(q)
      || a.customer_email.toLowerCase().includes(q);
  });

  const stats = { healthy: agents.filter(a => a.health === "healthy").length, warning: agents.filter(a => a.health === "warning").length, critical: agents.filter(a => a.health === "critical").length };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
          <h1 className="text-xl font-semibold text-white">Agent Monitor</h1>
          <p className="text-xs text-white/40 mt-0.5">Fiche détaillée de chaque agent IA surveillé par Guardian</p>
        </div>
        <div className="flex gap-3">
          {(["healthy", "warning", "critical"] as const).map((h) => {
            const hc = HEALTH_CFG[h];
            const Icon = hc.icon;
            return (
              <div key={h} className="rounded-lg border border-white/8 bg-[#0D0D14] px-3 py-2 text-center min-w-[60px]">
                <div className="font-mono text-lg font-bold" style={{ color: hc.color }}>{loading ? "—" : stats[h]}</div>
                <div className="text-[10px] text-white/40">{hc.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un agent…"
            className="pl-8 pr-4 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/60 text-white placeholder:text-white/30 w-52" />
        </div>
        <select value={filterHealth} onChange={(e) => setFilterHealth(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 outline-none cursor-pointer">
          <option value="all">Tous états</option>
          <option value="healthy">🟢 Healthy</option>
          <option value="warning">🟡 Warning</option>
          <option value="critical">🔴 Critical</option>
        </select>
        <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/60 outline-none cursor-pointer">
          <option value="all">Tous providers</option>
          <option value="anthropic-managed">Anthropic</option>
          <option value="openai-agents">OpenAI</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm font-mono">Chargement…</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                {["Agent", "Client", "État", "Provider", "Décisions", "DENY", "Politiques", "Vu il y a"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-white/30 first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-white/30 font-mono">Aucun agent trouvé.</td></tr>
              ) : filtered.map((a, i) => {
                const hc = HEALTH_CFG[a.health];
                const Icon = hc.icon;
                return (
                  <tr key={a.id} onClick={() => setSelected(a)}
                    className={`hover:bg-white/3 cursor-pointer transition-colors ${i < filtered.length - 1 ? "border-b border-white/5" : ""}`}>
                    <td className="pl-5 pr-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: hc.color }} />
                        <div>
                          <div className="text-white text-sm font-medium">{a.display_name ?? "—"}</div>
                          <div className="text-[10px] text-white/30 font-mono truncate max-w-[140px]">{a.native_agent_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50 font-mono">{a.customer_email}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
                        style={{ color: hc.color, borderColor: `${hc.color}30`, background: `${hc.color}10` }}>
                        {a.health_score} · {hc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40 font-mono">
                      {PROVIDER_LABEL[a.provider] ?? a.provider}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-white">{a.decisions_total}</div>
                      <div className="text-[10px] text-white/30">{a.decisions_7d} ce sem.</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm" style={{ color: a.deny_count > 0 ? "#FF2D2D" : "#6B7280" }}>
                        {a.deny_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      <span style={{ color: a.policy_count > 0 ? "#00C851" : "#FF2D2D" }}>{a.policy_count}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40 font-mono pr-5">{timeAgo(a.last_seen_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <AgentSheet agent={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
