import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("decisions")
      .select("id,decided_at,decision,tool_name,action_type,message,decided_in_ms")
      .order("decided_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setRows((data as Decision[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    let allow = 0,
      deny = 0,
      other = 0;
    rows.forEach((r) => {
      if (r.decision === "allow") allow++;
      else if (r.decision === "deny" || r.decision === "block") deny++;
      else other++;
    });
    return { allow, deny, other };
  }, [rows]);

  const download = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fortress-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
                  <th className="text-left p-3 font-mono">Decision</th>
                  <th className="text-left p-3 font-mono">Tool</th>
                  <th className="text-left p-3 font-mono">Message</th>
                  <th className="text-right p-3 font-mono">Latency</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/40 hover:bg-primary/5">
                    <td className="p-3">{decisionIcon(r.decision)}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.decided_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-xs uppercase">{r.decision}</td>
                    <td className="p-3 font-mono text-xs text-primary">{r.tool_name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-[400px]">{r.message ?? "—"}</td>
                    <td className="p-3 text-right font-mono text-xs">
                      {r.decided_in_ms != null ? `${r.decided_in_ms}ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </DashboardLayout>
  );
}
