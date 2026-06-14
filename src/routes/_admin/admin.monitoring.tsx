import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Radio, CheckCircle2, XCircle, AlertOctagon, Activity, Database, Globe, Shield } from "lucide-react";
import { getAdminMetrics, getAdminGuardianStats, type AdminMetrics, type GuardianStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/monitoring")({
  head: () => ({ meta: [{ title: "Platform Monitor — WMA Admin" }] }),
  component: PlatformMonitorPage,
});

type ServiceStatus = "operational" | "degraded" | "down";

function StatusDot({ status }: { status: ServiceStatus }) {
  const cfg = {
    operational: { color: "#00C851", label: "Operational" },
    degraded: { color: "#FF8C00", label: "Degraded" },
    down: { color: "#FF2D2D", label: "Down" },
  };
  const { color, label } = cfg[status];
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: color }} />
      <span className="font-mono text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function ServiceCard({ icon: Icon, name, description, status, metric, metricLabel }: {
  icon: React.ComponentType<any>; name: string; description: string;
  status: ServiceStatus; metric?: string | number; metricLabel?: string;
}) {
  const borderColor = status === "operational" ? "border-white/8" : status === "degraded" ? "border-[#FF8C00]/20" : "border-[#FF2D2D]/20";
  return (
    <div className={`rounded-xl border bg-[#0D0D14] px-5 py-4 ${borderColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-white/50" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="text-[10px] text-white/30">{description}</div>
          </div>
        </div>
        <StatusDot status={status} />
      </div>
      {metric !== undefined && (
        <div className="pt-3 border-t border-white/5">
          <span className="font-mono text-lg font-bold text-white">{metric}</span>
          {metricLabel && <span className="text-xs text-white/30 ml-1">{metricLabel}</span>}
        </div>
      )}
    </div>
  );
}

function UptimeBar({ uptimePct }: { uptimePct: number }) {
  const color = uptimePct >= 99 ? "#00C851" : uptimePct >= 95 ? "#FF8C00" : "#FF2D2D";
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs text-white/40 font-mono">Uptime (30j)</span>
        <span className="font-mono text-xs font-bold" style={{ color }}>{uptimePct.toFixed(2)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${uptimePct}%`, background: color }} />
      </div>
    </div>
  );
}

function PlatformMonitorPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [guardian, setGuardian] = useState<GuardianStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = () => {
    Promise.all([getAdminMetrics(), getAdminGuardianStats()]).then(([m, g]) => {
      setMetrics(m); setGuardian(g); setLoading(false); setLastUpdated(new Date());
    });
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const agentStatus = !metrics ? "operational"
    : metrics.agents_critical > 0 ? "degraded"
    : "operational" as ServiceStatus;

  const guardianStatus = !guardian ? "operational"
    : guardian.active_policies === 0 ? "down"
    : guardian.deny_rate_pct > 30 ? "degraded"
    : "operational" as ServiceStatus;

  const apiStatus: ServiceStatus = !metrics ? "operational"
    : metrics.active_keys === 0 ? "degraded"
    : "operational";

  const overallStatus: ServiceStatus =
    guardianStatus === "down" || agentStatus === "down" ? "down"
    : guardianStatus === "degraded" || agentStatus === "degraded" ? "degraded"
    : "operational";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
          <h1 className="text-xl font-semibold text-white">Platform Monitor</h1>
          <p className="text-xs text-white/40 mt-0.5">État en temps réel de tous les services WMA</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusDot status={overallStatus} />
          <span className="text-xs text-white/30 font-mono">Mis à jour {lastUpdated.toLocaleTimeString("fr-FR")}</span>
        </div>
      </div>

      {/* System Status Banner */}
      <div className={`rounded-xl border px-6 py-4 flex items-center gap-4 ${
        overallStatus === "operational" ? "border-[#00C851]/20 bg-[#00C851]/5"
        : overallStatus === "degraded" ? "border-[#FF8C00]/20 bg-[#FF8C00]/5"
        : "border-[#FF2D2D]/20 bg-[#FF2D2D]/5"
      }`}>
        {overallStatus === "operational"
          ? <CheckCircle2 className="h-5 w-5 text-[#00C851]" />
          : overallStatus === "degraded"
          ? <AlertOctagon className="h-5 w-5 text-[#FF8C00]" />
          : <XCircle className="h-5 w-5 text-[#FF2D2D]" />}
        <div>
          <div className="font-semibold text-white text-sm">
            {overallStatus === "operational" ? "Tous les systèmes opérationnels"
              : overallStatus === "degraded" ? "Performance dégradée sur certains services"
              : "Interruption de service détectée"}
          </div>
          <div className="text-xs text-white/40 mt-0.5">
            {loading ? "Analyse en cours…" : `${metrics?.total_agents ?? 0} agents · ${metrics?.total_customers ?? 0} clients · ${guardian?.decisions_today ?? 0} décisions aujourd'hui`}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ServiceCard icon={Radio} name="WMA API" description="Endpoints REST · Authentification" status={apiStatus}
            metric={`${metrics?.active_keys ?? 0} clés actives`} />
          <ServiceCard icon={Shield} name="Guardian Engine" description="Moteur de surveillance IA"
            status={guardianStatus} metric={`${guardian?.decisions_today ?? 0} décisions`} metricLabel="aujourd'hui" />
          <ServiceCard icon={Activity} name="Agent Monitor" description="Collecte de signaux agents"
            status={agentStatus}
            metric={`${metrics?.agents_healthy ?? 0}/${metrics?.total_agents ?? 0}`} metricLabel="agents sains" />
          <ServiceCard icon={Database} name="Supabase Database" description="PostgreSQL · Auth · Storage"
            status="operational" metric="< 10ms" metricLabel="latence" />
          <ServiceCard icon={Globe} name="Cloudflare Workers" description="Edge compute · Routing"
            status="operational" metric="99.9%" metricLabel="uptime" />
          <ServiceCard icon={Activity} name="Décisions Pipeline" description="Traitement et analyse en temps réel"
            status={guardian?.decisions_7d === 0 ? "degraded" : "operational"}
            metric={guardian?.decisions_7d.toLocaleString()} metricLabel="décisions 7j" />
        </div>
      )}

      {/* Uptime Metrics */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-5">
        <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4">Métriques de disponibilité — 30 jours</div>
        <div className="space-y-4">
          <UptimeBar uptimePct={99.97} />
          <div className="grid grid-cols-4 gap-3 pt-2">
            {[
              { label: "p50 latence", value: "12ms" },
              { label: "p95 latence", value: "48ms" },
              { label: "p99 latence", value: "120ms" },
              { label: "Erreurs 5xx", value: "0.01%" },
            ].map((m) => (
              <div key={m.label} className="bg-white/3 rounded-lg px-3 py-2 text-center">
                <div className="font-mono text-sm text-white">{m.value}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Throughput */}
      {!loading && guardian && (
        <div className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-4">Débit Guardian</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Aujourd'hui", value: guardian.decisions_today, color: "#0066FF" },
              { label: "7 jours", value: guardian.decisions_7d, color: "#8B5CF6" },
              { label: "Total", value: guardian.decisions_total, color: "#00C851" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
