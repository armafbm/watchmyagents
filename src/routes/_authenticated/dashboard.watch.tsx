import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Activity, Plus, X, ChevronRight, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat, SevBadge } from "@/components/dashboard/primitives";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/watch")({
  head: () => ({ meta: [{ title: "Watch · Monitoring — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: WatchPage,
});

type Agent = {
  id: string;
  display_name: string;
  anthropic_agent_id: string;
  status: string;
  last_seen_at: string | null;
  shield_mode_detected: string | null;
  agent_type: string | null;
  agent_type_confidence: number | null;
  agent_type_stage: string | null;
};

function TypologyBadge({ a }: { a: Agent }) {
  const t = a.agent_type;
  const dim = !t || t === "generic" || !a.agent_type_stage;
  const conf = a.agent_type_confidence != null ? Math.round(a.agent_type_confidence * 100) : null;
  return (
    <span
      className={`px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest ${
        dim ? "bg-muted/40 text-muted-foreground border-border/40"
            : "bg-primary/10 text-primary border-primary/30"
      }`}
      title="Detected agent typology"
    >
      {t ?? "unknown"}
      {a.agent_type_stage ? ` · ${a.agent_type_stage}` : ""}
      {conf != null ? ` · ${conf}%` : ""}
    </span>
  );
}


type SignalRow = {
  id: string;
  ingested_at: string;
  agent_id: string;
  window_start?: string | null;
  window_end?: string | null;
  payload: Record<string, unknown> | null;
};

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function severityFor(a: Agent): "OK" | "WARN" | "CRIT" | "INFO" {
  if (!a.last_seen_at) return "INFO";
  const ageMin = (Date.now() - new Date(a.last_seen_at).getTime()) / 60000;
  if (ageMin > 60) return "WARN";
  return "OK";
}

function severityOfSignal(p: Record<string, unknown> | null): "OK" | "WARN" | "CRIT" | "INFO" {
  if (!p) return "INFO";
  const sev = String((p as { severity?: unknown }).severity ?? "").toLowerCase();
  if (sev === "crit" || sev === "critical") return "CRIT";
  if (sev === "warn" || sev === "warning" || sev === "high") return "WARN";
  if (sev === "info") return "INFO";
  return "OK";
}

function kindOf(p: Record<string, unknown> | null): string {
  if (!p) return "signal";
  const k = (p as { kind?: unknown; type?: unknown }).kind ?? (p as { type?: unknown }).type;
  return typeof k === "string" ? k : "signal";
}

function summaryOf(p: Record<string, unknown> | null): string {
  if (!p) return "";
  const s = (p as { summary?: unknown; message?: unknown }).summary ?? (p as { message?: unknown }).message;
  if (typeof s === "string") return s;
  // derive from counts
  const counts = (p as { counts?: Record<string, number> }).counts;
  if (counts && typeof counts === "object") {
    const top = Object.entries(counts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([k, v]) => `${k}:${v}`)
      .join(" · ");
    return top || "telemetry burst";
  }
  return "";
}

function WatchPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [signalCountByAgent, setSignalCountByAgent] = useState<Record<string, number>>({});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: s }] = await Promise.all([
        supabase.from("agents").select("*").order("created_at", { ascending: false }),
        supabase
          .from("signals")
          .select("id,ingested_at,agent_id,window_start,window_end,payload")
          .order("ingested_at", { ascending: false })
          .limit(50),
      ]);
      const aRows = (a as Agent[] | null) ?? [];
      const sRows = (s as SignalRow[] | null) ?? [];
      setAgents(aRows);
      setSignals(sRows);
      const counts: Record<string, number> = {};
      sRows.forEach((r) => {
        counts[r.agent_id] = (counts[r.agent_id] ?? 0) + 1;
      });
      setSignalCountByAgent(counts);
      setLoading(false);
    })();
  }, []);

  const onlineCount = agents.filter((a) => severityFor(a) === "OK").length;
  const agentName = (id: string) => agents.find((a) => a.id === id)?.display_name ?? "—";

  return (
    <DashboardLayout breadcrumb="Watch · Monitoring">
      <PageHeader
        kicker="Watch"
        layer="watch"
        title="Telemetry for every agent action."
        subtitle="Traces, tool calls and prompts captured by your shield and ingested into Fortress."
        actions={
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Register agent
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Agents registered" value={loading ? "—" : String(agents.length)} tone="success" icon={Eye} />
        <Stat label="Online (last hour)" value={loading ? "—" : String(onlineCount)} icon={Activity} tone={onlineCount > 0 ? "success" : "warning"} />
        <Stat label="Signals (recent 50)" value={loading ? "—" : String(signals.length)} icon={Activity} />
        <Stat label="Unique sources" value={loading ? "—" : String(Object.keys(signalCountByAgent).length)} />
      </div>

      <Panel title="Agents under watch" icon={Eye} tag={loading ? "loading…" : `${agents.length} agent${agents.length === 1 ? "" : "s"}`}>
        {loading ? (
          <div className="space-y-2 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-md bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">No agent registered yet.</p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Register your first agent
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-mono">Agent</th>
                  <th className="text-left p-3 font-mono">Anthropic ID</th>
                  <th className="text-left p-3 font-mono">Shield</th>
                  <th className="text-left p-3 font-mono">Typology</th>
                  <th className="text-right p-3 font-mono">Signals (recent)</th>
                  <th className="text-left p-3 font-mono">Severity</th>
                  <th className="text-left p-3 font-mono">Last seen</th>
                  <th className="p-3" />
                </tr>

              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedAgent(a)}
                    className="border-t border-border/40 hover:bg-primary/5 cursor-pointer transition"
                  >
                    <td className="p-3 font-mono text-primary">{a.display_name}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                      {a.anthropic_agent_id}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {a.shield_mode_detected ?? "—"}
                    </td>
                    <td className="p-3"><TypologyBadge a={a} /></td>
                    <td className="p-3 text-right font-mono">{signalCountByAgent[a.id] ?? 0}</td>
                    <td className="p-3"><SevBadge sev={severityFor(a)} /></td>

                    <td className="p-3 font-mono text-xs text-muted-foreground">{relativeTime(a.last_seen_at)}</td>
                    <td className="p-3 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title="Signal tail" icon={Radio} tag={loading ? "loading…" : `live · last ${signals.length}`}>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-md bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : signals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No signals yet. Once your shield ingests events, they show here.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {signals.map((s) => (
                <SignalCard
                  key={s.id}
                  signal={s}
                  agentName={agentName(s.agent_id)}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>


      {selectedAgent && (
        <AgentDetailDrawer
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </DashboardLayout>
  );
}

function SignalCard({ signal, agentName }: { signal: SignalRow; agentName: string }) {
  const [open, setOpen] = useState(false);
  const sev = severityOfSignal(signal.payload);
  const kind = kindOf(signal.payload);
  const summary = summaryOf(signal.payload);
  const toneVar =
    sev === "CRIT" ? "danger" : sev === "WARN" ? "warning" : sev === "INFO" ? "muted-foreground" : "success";

  return (
    <li className="rounded-lg border border-border/40 bg-background/30 hover:border-primary/40 transition overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-stretch gap-3 text-left"
      >
        <span
          aria-hidden
          className="w-1 shrink-0"
          style={{ background: `var(--${toneVar})` }}
        />
        <div className="flex-1 grid grid-cols-[80px_110px_1fr_auto] items-center gap-3 px-3 py-2.5 min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground">
            {new Date(signal.ingested_at).toLocaleTimeString()}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded justify-self-start"
            style={{
              background: `color-mix(in oklab, var(--${toneVar}) 15%, transparent)`,
              color: `var(--${toneVar})`,
            }}
          >
            {kind}
          </span>
          <span className="text-sm text-muted-foreground truncate font-mono">
            <span className="text-foreground/80">{agentName}</span>
            {summary && <span className="text-muted-foreground"> · {summary}</span>}
          </span>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-background/40">
          <pre className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
            {JSON.stringify(signal.payload, null, 2)}
          </pre>
        </div>
      )}
    </li>
  );
}

function AgentDetailDrawer({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [logs, setLogs] = useState<SignalRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("signals")
        .select("id,ingested_at,agent_id,window_start,window_end,payload")
        .eq("agent_id", agent.id)
        .order("ingested_at", { ascending: false })
        .limit(200);
      if (!cancelled) setLogs((data as SignalRow[] | null) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [agent.id]);

  const stats = useMemo(() => {
    if (!logs) return null;
    const sevCounts: Record<"OK" | "WARN" | "CRIT" | "INFO", number> = { OK: 0, WARN: 0, CRIT: 0, INFO: 0 };
    logs.forEach((l) => sevCounts[severityOfSignal(l.payload)]++);
    return { total: logs.length, OK: sevCounts.OK, WARN: sevCounts.WARN, CRIT: sevCounts.CRIT, INFO: sevCounts.INFO };
  }, [logs]);

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-background/70 backdrop-blur-sm"
      />
      <aside className="w-full max-w-2xl h-full bg-card/95 backdrop-blur-xl border-l border-border/60 flex flex-col shadow-2xl">
        <header className="flex items-start justify-between gap-4 p-5 border-b border-border/40">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary mb-1">// Agent detail</p>
            <h2 className="font-display text-xl font-bold truncate">{agent.display_name}</h2>
            <p className="font-mono text-[11px] text-muted-foreground truncate mt-1">
              {agent.anthropic_agent_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-md border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-4 gap-2 p-5 border-b border-border/40">
          <MiniStat label="Logs" value={stats ? String(stats.total) : "…"} tone="primary" />
          <MiniStat label="OK" value={stats ? String(stats.OK) : "…"} tone="success" />
          <MiniStat label="Warn" value={stats ? String(stats.WARN) : "…"} tone="warning" />
          <MiniStat label="Crit" value={stats ? String(stats.CRIT) : "…"} tone="danger" />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold">Recent logs</h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              last {logs?.length ?? 0}
            </span>
          </div>
          {!logs ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs for this agent yet.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((s) => (
                <SignalCard key={s.id} signal={s} agentName={agent.display_name} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`font-display text-xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
