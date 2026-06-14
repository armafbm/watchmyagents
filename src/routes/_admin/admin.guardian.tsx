import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Dna, Shield, CheckCircle2, XCircle, Zap, Activity, FileText } from "lucide-react";
import { getAdminGuardianStats, type GuardianStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/guardian")({
  head: () => ({ meta: [{ title: "Guardian Command — WMA Admin" }] }),
  component: GuardianCommandPage,
});

function StatCard({ label, value, sub, color = "#0066FF", icon: Icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: React.ComponentType<any>;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-4">
      <div className="flex items-center gap-2 text-white/40 mb-3">
        {Icon && <Icon className="h-3.5 w-3.5" style={{ color }} />}
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-mono text-3xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-white/30 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

function ProgressBar({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-white/50">{label}</span>
        <span style={{ color }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function GuardianCommandPage() {
  const [stats, setStats] = useState<GuardianStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminGuardianStats().then((s) => { setStats(s); setLoading(false); });
  }, []);

  const immuneStatus = !stats ? null
    : stats.deny_rate_pct > 20 ? { label: "Activité élevée", color: "#FF8C00", dot: "bg-[#FF8C00]" }
    : stats.active_policies === 0 ? { label: "Non configuré", color: "#FF2D2D", dot: "bg-[#FF2D2D]" }
    : { label: "Opérationnel", color: "#00C851", dot: "bg-[#00C851]" };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
        <h1 className="text-xl font-semibold text-white">Guardian Command Center</h1>
        <p className="text-xs text-white/40 mt-0.5">Centre Immunitaire — moteur de surveillance et de protection automatique des agents IA</p>
      </div>

      {/* Global Status Banner */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-6 py-4 flex items-center justify-between">
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-white/30" /> : (
          <>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Dna className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Système Immunitaire Guardian</div>
                <div className="text-xs text-white/40">Surveillance continue · Détection proactive · Auto-réparation</div>
              </div>
            </div>
            {immuneStatus && (
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full animate-pulse ${immuneStatus.dot}`} />
                <span className="font-mono text-sm font-bold" style={{ color: immuneStatus.color }}>
                  {immuneStatus.label}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Décisions totales" value={stats.decisions_total.toLocaleString()} sub="Cas analysés par Guardian" color="#0066FF" icon={Activity} />
            <StatCard label="DENY (blocages)" value={stats.deny_total.toLocaleString()} sub={`${stats.deny_rate_pct}% du trafic`} color="#FF2D2D" icon={XCircle} />
            <StatCard label="INTERRUPT" value={stats.interrupt_total.toLocaleString()} sub="Interventions Guardian" color="#FF8C00" icon={Zap} />
            <StatCard label="Politiques actives" value={stats.active_policies} sub={`${stats.total_policies} au total`} color="#00C851" icon={Shield} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Decision Breakdown */}
            <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Activity className="h-3 w-3" /> Répartition des Décisions
              </div>
              <div className="space-y-4">
                <ProgressBar label="ALLOW — Actions autorisées" value={stats.allow_total} color="#00C851" max={stats.decisions_total} />
                <ProgressBar label="DENY — Actions bloquées" value={stats.deny_total} color="#FF2D2D" max={stats.decisions_total} />
                <ProgressBar label="INTERRUPT — Interventions" value={stats.interrupt_total} color="#FF8C00" max={stats.decisions_total} />
              </div>
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="flex h-3 rounded-full overflow-hidden gap-px">
                  {stats.decisions_total > 0 && <>
                    <div style={{ width: `${Math.round((stats.allow_total / stats.decisions_total) * 100)}%` }} className="h-full bg-[#00C851]" />
                    <div style={{ width: `${Math.round((stats.deny_total / stats.decisions_total) * 100)}%` }} className="h-full bg-[#FF2D2D]" />
                    <div style={{ width: `${Math.round((stats.interrupt_total / stats.decisions_total) * 100)}%` }} className="h-full bg-[#FF8C00]" />
                  </>}
                </div>
              </div>
            </div>

            {/* Coverage */}
            <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Shield className="h-3 w-3" /> Couverture de Protection
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Clients avec politiques</span>
                  <span className="font-mono text-sm text-[#00C851] font-bold">{stats.agents_with_policies}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Clients sans protection</span>
                  <span className="font-mono text-sm font-bold" style={{ color: stats.agents_without_policies > 0 ? "#FF2D2D" : "#6B7280" }}>
                    {stats.agents_without_policies}
                  </span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Décisions aujourd'hui</span>
                  <span className="font-mono text-sm text-white font-bold">{stats.decisions_today}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Décisions 7 jours</span>
                  <span className="font-mono text-sm text-white font-bold">{stats.decisions_7d}</span>
                </div>
              </div>

              {stats.agents_without_policies > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-[#FF2D2D]/5 border border-[#FF2D2D]/15">
                  <div className="text-xs text-[#FF2D2D] font-mono">
                    ⚠ {stats.agents_without_policies} client(s) sans politique Guardian active — risque élevé
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending Manual Actions */}
          <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <FileText className="h-3 w-3" /> File Manuelle — Interventions Requises
            </div>
            {stats.deny_rate_pct > 15 ? (
              <div className="rounded-lg bg-[#FF8C00]/5 border border-[#FF8C00]/15 px-4 py-3">
                <div className="text-sm text-[#FF8C00] font-mono font-semibold">⚠ Taux de DENY élevé : {stats.deny_rate_pct}%</div>
                <div className="text-xs text-white/50 mt-1">Vérifier les politiques Guardian — possible sur-blocage</div>
              </div>
            ) : (
              <div className="text-sm text-white/30 font-mono text-center py-4">
                ✓ Aucune intervention manuelle requise
              </div>
            )}
          </div>

          {/* Immune System Modules */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Dérive de prompt", status: "monitoring", color: "#0066FF", desc: "Analyse continue" },
              { label: "Hallucinations", status: "monitoring", color: "#8B5CF6", desc: "Détection active" },
              { label: "Injections", status: "active", color: "#00C851", desc: "Protection ON" },
              { label: "Auto-réparation", status: "ready", color: "#F59E0B", desc: "Prêt à intervenir" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-white/8 bg-[#0D0D14] px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: m.color }} />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">{m.label}</span>
                </div>
                <div className="text-sm font-mono" style={{ color: m.color }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
