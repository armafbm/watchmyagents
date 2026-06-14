import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Users, Bot, Activity, Key, TrendingUp, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { getAdminMetrics, getAdminAlerts, type AdminMetrics, type AlertEvent } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({ meta: [{ title: "Mission Control — WMA Admin" }, { name: "robots", content: "noindex" }] }),
  component: MissionControlPage,
});

const SEVERITY_CONFIG = {
  critical: { dot: "bg-[#FF2D2D]", badge: "bg-[#FF2D2D]/10 text-[#FF2D2D] border-[#FF2D2D]/20", label: "CRITICAL" },
  high:     { dot: "bg-[#FF8C00]", badge: "bg-[#FF8C00]/10 text-[#FF8C00] border-[#FF8C00]/20", label: "HIGH" },
  medium:   { dot: "bg-yellow-400", badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20", label: "MEDIUM" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#00C851" : score >= 45 ? "#FF8C00" : "#FF2D2D";
  const r = 40, c = 44, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={88} height={88} className="-rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold font-mono" style={{ color }}>{score}</div>
        <div className="text-[9px] text-white/40 font-mono">/100</div>
      </div>
    </div>
  );
}

function AgentDonut({ healthy, warning, critical }: { healthy: number; warning: number; critical: number }) {
  const total = Math.max(healthy + warning + critical, 1);
  const pct = (n: number) => Math.round((n / total) * 100);
  const bars = [
    { pct: pct(healthy), color: "#00C851", label: "Healthy" },
    { pct: pct(warning), color: "#FF8C00", label: "Warning" },
    { pct: pct(critical), color: "#FF2D2D", label: "Critical" },
  ];
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {bars.map((b) => b.pct > 0 && (
          <div key={b.label} style={{ width: `${b.pct}%`, background: b.color }} className="h-full" />
        ))}
      </div>
      <div className="flex gap-4">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: b.color }} />
            <span className="text-[11px] text-white/50 font-mono">{b.label} {b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MissionControlPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminMetrics(), getAdminAlerts()]).then(([m, a]) => {
      setMetrics(m); setAlerts(a); setLoading(false);
    });
    const interval = setInterval(() => {
      getAdminAlerts().then(setAlerts);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const healthColor = !metrics ? "#0066FF"
    : metrics.global_health_score >= 75 ? "#00C851"
    : metrics.global_health_score >= 45 ? "#FF8C00"
    : "#FF2D2D";

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 space-y-6">
      {/* ── TOP BANNER ── */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Watch My Agents</div>
                <div className="text-sm font-semibold text-white">Mission Control Center</div>
              </div>
            </div>
            {metrics && (
              <div className="flex items-center gap-2 pl-4 border-l border-white/8">
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: healthColor }} />
                <span className="font-mono text-sm font-bold" style={{ color: healthColor }}>
                  {metrics.global_health_score} / 100
                </span>
                <span className="text-xs text-white/40">Score de santé global</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm font-mono">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/30" />
            ) : (
              <>
                <span className="text-white/60">Agents <span className="text-white font-bold">{metrics?.total_agents ?? 0}</span></span>
                <span className="text-[#00C851]">Sains <span className="font-bold">{metrics?.agents_healthy ?? 0}</span></span>
                <span className="text-[#FF8C00]">⚠ <span className="font-bold">{metrics?.agents_warning ?? 0}</span></span>
                <span className="text-[#FF2D2D]">🔴 <span className="font-bold">{metrics?.agents_critical ?? 0}</span></span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 3-COLUMN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT — Alert Feed */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-[#FF2D2D]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">Flux Alertes</span>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-[#FF2D2D] animate-pulse" />
            </div>
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-white/30 font-mono">
                  ✓ Aucune alerte active
                </div>
              ) : (
                alerts.map((a) => {
                  const s = SEVERITY_CONFIG[a.severity];
                  return (
                    <div key={a.id} className="px-4 py-3 hover:bg-white/3 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${s.badge}`}>
                              {s.label}
                            </span>
                            <span className="text-[10px] text-white/30 font-mono">{timeAgo(a.ts)}</span>
                          </div>
                          <div className="text-xs text-white/80 font-medium truncate">{a.title}</div>
                          <div className="text-[10px] text-white/40 truncate">{a.detail}</div>
                          <div className="text-[10px] text-blue-400/60 font-mono truncate">{a.customer_email}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Guardian Summary */}
          <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-4 py-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2">
              <span>Centre Immunitaire</span>
            </div>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-white/30" /> : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Alertes actives", value: alerts.filter(a => a.severity === "critical").length, color: "#FF2D2D" },
                  { label: "Agents hors-ligne", value: alerts.filter(a => a.type === "agent_offline").length, color: "#FF8C00" },
                  { label: "DENY 24h", value: alerts.filter(a => a.type === "deny_spike").length, color: "#0066FF" },
                  { label: "INTERRUPT 24h", value: alerts.filter(a => a.type === "interrupt").length, color: "white" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/3 rounded-lg px-3 py-2">
                    <div className="font-mono text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER — Health Donut + Agents */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-6 py-5 flex items-center gap-6">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-white/30" /> : (
              <>
                <ScoreRing score={metrics?.global_health_score ?? 0} />
                <div className="flex-1 space-y-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Santé Agents IA</div>
                  {metrics && <AgentDonut healthy={metrics.agents_healthy} warning={metrics.agents_warning} critical={metrics.agents_critical} />}
                  <div className="text-[11px] text-white/40">
                    {metrics?.total_agents ?? 0} agents surveillés par Watch My Agents
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Threat Map */}
          <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-4 py-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">Carte des Menaces</div>
            {[
              { level: "CRITIQUE", items: alerts.filter(a => a.severity === "critical").slice(0, 2).map(a => a.title), color: "#FF2D2D" },
              { level: "ÉLEVÉ",   items: alerts.filter(a => a.severity === "high").slice(0, 2).map(a => a.title),    color: "#FF8C00" },
              { level: "MOYEN",   items: alerts.filter(a => a.severity === "medium").slice(0, 2).map(a => a.title),  color: "#FFD700" },
            ].map((cat) => (
              <div key={cat.level} className="mb-2">
                <div className="text-[10px] font-mono font-bold mb-1" style={{ color: cat.color }}>{cat.level}</div>
                {cat.items.length === 0 ? (
                  <div className="text-[11px] text-white/20 pl-3">— Aucune menace</div>
                ) : (
                  cat.items.map((item, i) => (
                    <div key={i} className="text-[11px] text-white/50 pl-3 truncate">• {item}</div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — KPI Business */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center pt-8"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
          ) : (
            <>
              {[
                { icon: Users, label: "Clients actifs", value: metrics?.total_customers ?? 0, format: "n", color: "#0066FF" },
                { icon: TrendingUp, label: "MRR estimé", value: metrics?.mrr_estimate ?? 0, format: "$", color: "#00C851" },
                { icon: Activity, label: "Décisions totales", value: metrics?.total_decisions ?? 0, format: "n", color: "#8B5CF6" },
                { icon: Key, label: "Clés API actives", value: metrics?.active_keys ?? 0, format: "n", color: "#F59E0B" },
                { icon: DollarSign, label: "Coût IA aujourd'hui", value: metrics?.cost_estimate_today ?? 0, format: "$2", color: "#EC4899" },
                { icon: Bot, label: "Agents surveillés", value: metrics?.total_agents ?? 0, format: "n", color: "#06B6D4" },
              ].map(({ icon: Icon, label, value, format, color }) => (
                <div key={label} className="rounded-xl border border-white/8 bg-[#0D0D14] px-4 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-white/40 font-mono">{label}</div>
                    <div className="font-mono text-lg font-bold text-white">
                      {format === "$" ? `$${value.toLocaleString()}`
                        : format === "$2" ? `$${value.toFixed(2)}`
                        : value.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Plan Breakdown */}
              <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-4 py-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">Plans</div>
                {Object.entries(metrics?.plan_breakdown ?? {}).sort(([, a], [, b]) => b - a).map(([plan, count]) => {
                  const COLORS: Record<string, string> = { free: "#6B7280", pro: "#3B82F6", pro_plus: "#8B5CF6", business: "#F59E0B", advanced: "#10B981" };
                  const color = COLORS[plan] ?? "#fff";
                  return (
                    <div key={plan} className="flex items-center gap-2 mb-1.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-mono" style={{ color }}>{plan}</span>
                      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(count / Math.max(metrics?.total_customers ?? 1, 1)) * 100}%`, background: color }} />
                      </div>
                      <span className="text-xs font-mono text-white/60">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
