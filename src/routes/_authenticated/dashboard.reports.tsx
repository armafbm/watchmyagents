import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports & Audit — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: ReportsPage,
});

const reports = [
  { kind: "Daily", date: "15 May 2026", size: "1.2 MB", status: "ready" },
  { kind: "Weekly", date: "12 May 2026", size: "4.8 MB", status: "ready" },
  { kind: "Monthly", date: "1 May 2026", size: "18.2 MB", status: "ready" },
  { kind: "Incident", date: "23 Apr 2026 · Crimson Probe", size: "642 KB", status: "ready" },
];

function ReportsPage() {
  return (
    <DashboardLayout breadcrumb="Reports & Audit">
      <PageHeader
        kicker="Intelligence"
        title="Auditable, exportable, court-ready."
        subtitle="Every signal, policy change and Guardian decision is traced. Export for SOC2, ISO 27001 or your CISO."
      />

      <Panel title="Recent reports" icon={FileText} tag={`${reports.length} items`}>
        <ul className="divide-y divide-border/40 -my-2">
          {reports.map((r) => (
            <li key={r.date} className="py-3 flex items-center gap-4">
              <div
                className="h-9 w-9 rounded-md grid place-items-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.kind} report</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {r.date} · {r.size}
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-success">
                {r.status}
              </span>
              <button className="ml-2 inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border/60 hover:border-primary text-xs font-mono uppercase tracking-widest">
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </DashboardLayout>
  );
}
