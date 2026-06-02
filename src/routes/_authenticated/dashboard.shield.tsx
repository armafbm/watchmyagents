import { createFileRoute } from "@tanstack/react-router";
import { Shield, GitPullRequest, Lock, Plus, Pencil, Trash2, Loader2, Globe, Layers, User, GitBranch, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PolicyEditor, type PolicyDraft } from "@/components/fortress/PolicyEditor";
import { ProviderBadge, type AgentProvider } from "@/components/fortress/ProviderBadge";
import { EnforcementBadge, isDetectOnly, type EnforcementMode } from "@/components/fortress/EnforcementBadge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/shield")({
  head: () => ({ meta: [{ title: "Shield · Defense — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: ShieldPage,
});

type Policy = {
  id: string;
  rule_id: string;
  name: string;
  rationale: string | null;
  action: string;
  message: string | null;
  match: unknown;
  enabled: boolean;
  priority: number;
  suggested_by_guardian: boolean;
  surface_type: string | null;
  surface_ref: string | null;
  agent_id: string | null;
  mode: "enforce" | "shadow" | null;
  signature: string | null;
  signing_key_id: string | null;
  signed_at: string | null;
};

type AgentMini = {
  id: string;
  display_name: string;
  agent_type: string | null;
  provider: string | null;
  enforcement_mode: EnforcementMode;
};

type SurfaceFilter = "all" | "fleet" | "type" | "agent" | "subtree";

function actionTone(a: string) {
  if (a === "deny" || a === "block") return "bg-danger/15 text-danger border-danger/30";
  if (a === "interrupt") return "bg-warning/15 text-warning border-warning/30";
  return "bg-success/15 text-success border-success/30";
}

function AppliesToBadge({
  p,
  agents,
}: {
  p: Policy;
  agents: AgentMini[];
}) {
  // back-compat: rows with NULL surface_type
  const surface = p.surface_type ?? (p.agent_id ? "agent" : "fleet");

  if (surface === "fleet") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-[oklch(0.55_0.2_290_/_0.15)] text-[oklch(0.75_0.2_290)] border-[oklch(0.55_0.2_290_/_0.4)]">
        <Globe className="h-3 w-3" /> All agents · fleet
      </span>
    );
  }
  if (surface === "type") {
    const ref = p.surface_ref ?? "—";
    const count = agents.filter((a) => a.agent_type === ref).length;
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-[oklch(0.55_0.18_240_/_0.15)] text-[oklch(0.75_0.18_240)] border-[oklch(0.55_0.18_240_/_0.4)]">
        <Layers className="h-3 w-3" /> All {ref} agents · {count}
      </span>
    );
  }
  if (surface === "subtree") {
    const root = agents.find((x) => x.id === p.surface_ref);
    const label = root?.display_name ?? (p.surface_ref ? `${p.surface_ref.slice(0, 8)}…` : "—");
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-[oklch(0.55_0.18_240_/_0.15)] text-[oklch(0.75_0.18_240)] border-[oklch(0.55_0.18_240_/_0.4)]">
        <GitBranch className="h-3 w-3" /> Subtree · {label}
      </span>
    );
  }
  // agent
  const a = agents.find((x) => x.id === p.agent_id);
  const label = a?.display_name ?? (p.agent_id ? `${p.agent_id.slice(0, 8)}…` : "—");
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <ProviderBadge provider={(a?.provider as AgentProvider | null) ?? null} />
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-[oklch(0.6_0.18_50_/_0.15)] text-[oklch(0.78_0.18_50)] border-[oklch(0.6_0.18_50_/_0.4)]">
        <User className="h-3 w-3" /> {label}
      </span>
      {a && <EnforcementBadge mode={a.enforcement_mode} />}
    </span>
  );
}

function ShieldPage() {
  const [list, setList] = useState<Policy[]>([]);
  const [agents, setAgents] = useState<AgentMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PolicyDraft | null>(null);
  const [filter, setFilter] = useState<SurfaceFilter>("all");

  const reload = async () => {
    setLoading(true);
    const [{ data: pData }, { data: aData }] = await Promise.all([
      supabase.from("policies").select("*").order("priority"),
      supabase.from("agents").select("id, display_name, agent_type, provider, enforcement_mode"),
    ]);
    setList((pData as Policy[] | null) ?? []);
    setAgents((aData as AgentMini[] | null) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    reload();
  }, []);

  const toggle = async (p: Policy, enabled: boolean) => {
    const { error } = await supabase.from("policies").update({ enabled }).eq("id", p.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const remove = async (p: Policy) => {
    if (!confirm(`Delete policy "${p.name}"?`)) return;
    const { error } = await supabase.from("policies").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const onSaved = () => {
    setEditing(null);
    reload();
  };

  const filtered = useMemo(() => {
    if (filter === "all") return list;
    return list.filter((p) => {
      const s = p.surface_type ?? (p.agent_id ? "agent" : "fleet");
      return s === filter;
    });
  }, [list, filter]);

  const activeCount = list.filter((p) => p.enabled).length;
  const draftCount = list.filter((p) => !p.enabled).length;
  const guardianCount = list.filter((p) => p.suggested_by_guardian).length;

  const FILTER_CHIPS: { id: SurfaceFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "fleet", label: "Fleet" },
    { id: "type", label: "By type" },
    { id: "subtree", label: "By subtree" },
    { id: "agent", label: "By agent" },
  ];

  return (
    <DashboardLayout breadcrumb="Shield · Defense">
      <PageHeader
        kicker="Shield"
        layer="shield"
        title="Enforce, simulate, roll back."
        subtitle="Every policy is auditable. Every change is linked to the signal that triggered it."
        actions={
          <Button onClick={() => setEditing({} as PolicyDraft)}>
            <Plus className="h-4 w-4 mr-2" /> New policy
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Active policies" value={loading ? "—" : String(activeCount)} icon={Shield} tone="success" />
        <Stat label="Disabled / draft" value={loading ? "—" : String(draftCount)} icon={GitPullRequest} tone="warning" />
        <Stat label="From Guardian" value={loading ? "—" : String(guardianCount)} icon={Lock} />
        <Stat label="Total" value={loading ? "—" : String(list.length)} />
      </div>

      {agents.some((a) => isDetectOnly(a.enforcement_mode)) && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          <div className="font-semibold mb-0.5 flex items-center gap-2">
            <Eye className="h-4 w-4" /> Detection-only agents in fleet
          </div>
          <p className="text-xs text-warning/90">
            Shield enforcement is not available for adapters reporting <code className="font-mono">detect_only</code>. WMA
            will surface findings in Reports &amp; Audit but cannot block actions in real time. Policies targeting these
            agents are kept in monitor mode.
          </p>
        </div>
      )}

      <Panel title="Policies" icon={Lock} tag={`${filtered.length} / ${list.length}`}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {FILTER_CHIPS.map((c) => {
            const active = filter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`px-3 py-1 rounded-full border font-mono text-[10px] uppercase tracking-widest transition ${
                  active
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-background/60 text-muted-foreground border-border/60 hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-display text-lg font-bold mb-1">
              {list.length === 0 ? "No policy yet" : "No policy matches this filter"}
            </div>
            {list.length === 0 && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Create one manually or accept a Guardian suggestion.
                </p>
                <Button onClick={() => setEditing({} as PolicyDraft)}>
                  <Plus className="h-4 w-4 mr-2" /> Create your first policy
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-mono">Rule ID</th>
                  <th className="text-left p-3 font-mono">Name</th>
                  <th className="text-left p-3 font-mono">Applies to</th>
                  <th className="text-left p-3 font-mono">Action</th>
                  <th className="text-left p-3 font-mono">Enabled</th>
                  <th className="text-right p-3 font-mono">·</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-primary/5">
                    <td className="p-3 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded border border-border/60 bg-background/60">
                        {p.rule_id}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">{p.name}</div>
                      {p.suggested_by_guardian && (
                        <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
                          guardian
                        </div>
                      )}
                    </td>
                    <td className="p-3"><AppliesToBadge p={p} agents={agents} /></td>
                    <td className="p-3">
                      {(() => {
                        const targetAgent =
                          p.surface_type === "agent" || (!p.surface_type && p.agent_id)
                            ? agents.find((x) => x.id === p.agent_id)
                            : null;
                        const detectOnly = targetAgent ? isDetectOnly(targetAgent.enforcement_mode) : false;
                        return (
                          <div className="flex flex-col gap-1">
                            <span
                              className={`px-2 py-0.5 rounded border text-xs font-mono uppercase tracking-widest w-fit ${
                                detectOnly ? "bg-muted text-muted-foreground border-border line-through" : actionTone(p.action)
                              }`}
                              title={detectOnly ? "Adapter is detect-only — enforcement disabled, rule runs in monitor mode." : undefined}
                            >
                              {p.action}
                            </span>
                            {(p.mode ?? "enforce") === "shadow" && (
                              <span
                                title="Shadow mode: rule is evaluated and logged but does NOT block the agent."
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border w-fit font-mono text-[10px] uppercase tracking-widest bg-warning/10 text-warning/90 border-warning/30"
                              >
                                🌓 shadow
                              </span>
                            )}
                            {detectOnly && (
                              <span className="font-mono text-[10px] uppercase tracking-widest text-warning">
                                monitor-only
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3">
                      {(() => {
                        const targetAgent =
                          p.surface_type === "agent" || (!p.surface_type && p.agent_id)
                            ? agents.find((x) => x.id === p.agent_id)
                            : null;
                        const detectOnly = targetAgent ? isDetectOnly(targetAgent.enforcement_mode) : false;
                        return (
                          <Switch
                            checked={p.enabled}
                            disabled={detectOnly}
                            onCheckedChange={(v) => toggle(p, v)}
                          />
                        );
                      })()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() =>
                            setEditing({
                              id: p.id,
                              rule_id: p.rule_id,
                              name: p.name,
                              rationale: p.rationale ?? "",
                              action: p.action,
                              message: p.message ?? "",
                              match: JSON.stringify(p.match ?? {}, null, 2),
                              surface_type: (p.surface_type as "agent" | "subtree" | "type" | "fleet" | undefined) ?? undefined,
                              surface_ref: p.surface_ref ?? undefined,
                              agent_id: p.agent_id ?? undefined,
                              mode: (p.mode ?? "enforce") as "enforce" | "shadow",
                            })
                          }
                          className="p-2 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(p)}
                          className="p-2 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editing && (
        <PolicyEditor draft={editing} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </DashboardLayout>
  );
}
