import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, CheckCircle2, XCircle, AlertTriangle, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProviderBadge, type AgentProvider } from "@/components/fortress/ProviderBadge";
import { SessionIdChip } from "@/components/fortress/SessionIdChip";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports & Audit — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: ReportsPage,
});

type Decision = {
  id: string;
  decided_at: string;
  decision: string;
  tool_name: string | null;
  action_type: string | null;
  message: string | null;
  decided_in_ms: number | null;
  agent_id: string;
};

type AgentMini = {
  id: string;
  display_name: string;
  provider: string | null;
  parent_agent_id: string | null;
};

type AuditRow = {
  id: string;
  created_at: string;
  user_id: string;
  action: "reveal" | "copy" | "export";
  session_id: string;
  signal_id: string | null;
};


function decisionIcon(d: string) {
  if (d === "allow") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (d === "deny" || d === "block") return <XCircle className="h-4 w-4 text-danger" />;
  return <AlertTriangle className="h-4 w-4 text-warning" />;
}

function toCsv(rows: Decision[]) {
  const header = ["decided_at", "decision", "tool_name", "action_type", "message", "decided_in_ms"];
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.decided_at, r.decision, r.tool_name, r.action_type, r.message, r.decided_in_ms]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

function ReportsPage() {
  const [rows, setRows] = useState<Decision[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentMini>>({});
  const [loading, setLoading] = useState(true);
  const [includeSessionIds, setIncludeSessionIds] = useState(false);
  const [auditRows, setAuditRows] = useState<AuditRow[] | null>(null);
  const [auditFilter, setAuditFilter] = useState<"all" | "reveal" | "copy" | "export">("all");

  useEffect(() => {
    (async () => {
      const [{ data: d }, { data: a }] = await Promise.all([
        supabase
          .from("decisions")
          .select("id,decided_at,decision,tool_name,action_type,message,decided_in_ms,agent_id")
          .order("decided_at", { ascending: false })
          .limit(500),
        supabase.from("agents").select("id, display_name, provider, parent_agent_id"),
      ]);
      setRows((d as Decision[] | null) ?? []);
      const map: Record<string, AgentMini> = {};
      ((a as AgentMini[] | null) ?? []).forEach((x) => { map[x.id] = x; });
      setAgents(map);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("session_id_audit_log")
        .select("id,created_at,user_id,action,session_id,signal_id")
        .order("created_at", { ascending: false })
        .limit(500);
      setAuditRows((data as AuditRow[] | null) ?? []);
    })();
  }, []);

  const stats = useMemo(() => {
    let allow = 0, deny = 0, other = 0;
    rows.forEach((r) => {
      if (r.decision === "allow") allow++;
      else if (r.decision === "deny" || r.decision === "block") deny++;
      else other++;
    });
    return { allow, deny, other };
  }, [rows]);

  const download = async () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fortress-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (includeSessionIds) {
      // The decisions CSV itself carries no session_ids today, but we audit the
      // operator's intent to export them so the policy holds when future
      // joined exports are added.
      try {
        await supabase.rpc("log_session_id_access", {
          p_signal_id: "00000000-0000-0000-0000-000000000000",
          p_session_id: "(bulk export request)",
          p_action: "export",
        });
      } catch { /* non-fatal */ }
    }
  };

  const filteredAudit = (auditRows ?? []).filter(
    (r) => auditFilter === "all" || r.action === auditFilter,
  );

  return (
    <DashboardLayout breadcrumb="Reports & Audit">
      <PageHeader
        kicker="Intelligence"
        title="Auditable, exportable, court-ready."
        subtitle="Every Shield decision is traced and exportable for SOC2, ISO 27001 or your CISO."
        actions={
          <Button onClick={download} disabled={rows.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Decisions in scope" value={String(rows.length)} icon={FileText} />
        <Stat label="Allowed" value={String(stats.allow)} tone="success" />
        <Stat label="Denied / blocked" value={String(stats.deny)} tone="danger" />
        <Stat label="Other" value={String(stats.other)} tone="warning" />
      </div>

      <Panel title="Decision history" icon={FileText} tag="last 500">
        {loading ? (
          <div className="py-10 text-center text-muted-foreground text-sm font-mono">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-display text-lg font-bold mb-1">No decision recorded yet</div>
            <p className="text-sm text-muted-foreground">
              Once your shield enforces policies, every decision will be logged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-mono">·</th>
                  <th className="text-left p-3 font-mono">When</th>
                  <th className="text-left p-3 font-mono">Agent</th>
                  <th className="text-left p-3 font-mono">Decision</th>
                  <th className="text-left p-3 font-mono">Tool</th>
                  <th className="text-left p-3 font-mono">Message</th>
                  <th className="text-right p-3 font-mono">Latency</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const ag = agents[r.agent_id];
                  // Build lineage path: root › … › this agent (cap depth 10)
                  const chain: AgentMini[] = [];
                  let cursor: AgentMini | undefined = ag;
                  const seen = new Set<string>();
                  while (cursor && !seen.has(cursor.id) && chain.length < 10) {
                    chain.unshift(cursor);
                    seen.add(cursor.id);
                    cursor = cursor.parent_agent_id ? agents[cursor.parent_agent_id] : undefined;
                  }
                  return (
                    <tr key={r.id} className="border-t border-border/40 hover:bg-primary/5">
                      <td className="p-3">{decisionIcon(r.decision)}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.decided_at).toLocaleString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ProviderBadge provider={(ag?.provider as AgentProvider | null) ?? null} />
                          <span className="font-mono text-xs text-foreground/90">
                            {ag?.display_name ?? `${r.agent_id.slice(0, 8)}…`}
                          </span>
                        </div>
                        {chain.length > 1 && (
                          <div className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate max-w-[280px]">
                            {chain.map((n) => n.display_name).join(" › ")}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs uppercase">{r.decision}</td>
                      <td className="p-3 font-mono text-xs text-primary">{r.tool_name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground truncate max-w-[400px]">{r.message ?? "—"}</td>
                      <td className="p-3 text-right font-mono text-xs">
                        {r.decided_in_ms != null ? `${r.decided_in_ms}ms` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </DashboardLayout>
  );
}
