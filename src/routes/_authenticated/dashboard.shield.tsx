import { createFileRoute } from "@tanstack/react-router";
import { Shield, GitPullRequest, CheckCircle2, Lock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_authenticated/dashboard/shield")({
  head: () => ({ meta: [{ title: "Shield · Defense — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: ShieldPage,
});

const policies = [
  { name: "Block oversized exports", mode: "Enforce", scope: "all prod agents", hits: 12, status: "active" },
  { name: "Quarantine prompt injection", mode: "Enforce", scope: "agent.support, agent.research", hits: 4, status: "active" },
  { name: "Limit tool scope=admin", mode: "Audit", scope: "agent.finance", hits: 1, status: "draft" },
  { name: "Redact PII in responses", mode: "Enforce", scope: "all agents", hits: 87, status: "active" },
];

function ShieldPage() {
  return (
    <DashboardLayout breadcrumb="Shield · Defense">
      <PageHeader
        kicker="Shield"
        title="Enforce, simulate, roll back."
        subtitle="Every policy is auditable. Every change is linked to the Watch signal that triggered it."
        actions={
          <button className="hidden md:inline-flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            <GitPullRequest className="h-4 w-4" /> New policy
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Active policies" value="14" delta="2 in audit" icon={Shield} tone="success" />
        <Stat label="Blocks · 24h" value="12" delta="3 critical" tone="danger" />
        <Stat label="Pending review" value="1" delta="needs approval" tone="warning" icon={GitPullRequest} />
        <Stat label="Rollback ready" value="100%" delta="all versions kept" tone="success" icon={CheckCircle2} />
      </div>

      <Panel title="Policies" icon={Lock} tag="draft → simulated → approved → enforced">
        <div className="overflow-x-auto -m-5">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-mono">Policy</th>
                <th className="text-left p-3 font-mono">Mode</th>
                <th className="text-left p-3 font-mono">Scope</th>
                <th className="text-right p-3 font-mono">Hits 24h</th>
                <th className="text-left p-3 font-mono">Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.name} className="border-t border-border/40 hover:bg-primary/5">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3 font-mono text-xs">
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{
                        background: p.mode === "Enforce" ? "color-mix(in oklab, var(--success) 18%, transparent)" : "color-mix(in oklab, var(--warning) 18%, transparent)",
                        color: p.mode === "Enforce" ? "var(--success)" : "var(--warning)",
                      }}
                    >
                      {p.mode}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{p.scope}</td>
                  <td className="p-3 text-right font-mono">{p.hits}</td>
                  <td className="p-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </DashboardLayout>
  );
}
