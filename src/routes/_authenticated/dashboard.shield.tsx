import { createFileRoute } from "@tanstack/react-router";
import { Shield, GitPullRequest, Lock, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PolicyEditor, type PolicyDraft } from "@/components/fortress/PolicyEditor";
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
};

function actionTone(a: string) {
  if (a === "deny" || a === "block") return "bg-danger/15 text-danger border-danger/30";
  if (a === "interrupt") return "bg-warning/15 text-warning border-warning/30";
  return "bg-success/15 text-success border-success/30";
}

function ShieldPage() {
  const [list, setList] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PolicyDraft | null>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("policies").select("*").order("priority");
    setList((data as Policy[] | null) ?? []);
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

  const activeCount = list.filter((p) => p.enabled).length;
  const draftCount = list.filter((p) => !p.enabled).length;
  const guardianCount = list.filter((p) => p.suggested_by_guardian).length;

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


      <Panel title="Policies" icon={Lock} tag={`${list.length} rule${list.length === 1 ? "" : "s"}`}>
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-display text-lg font-bold mb-1">No policy yet</div>
            <p className="text-sm text-muted-foreground mb-4">
              Create one manually or accept a Guardian suggestion.
            </p>
            <Button onClick={() => setEditing({} as PolicyDraft)}>
              <Plus className="h-4 w-4 mr-2" /> Create your first policy
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-mono">Rule ID</th>
                  <th className="text-left p-3 font-mono">Name</th>
                  <th className="text-left p-3 font-mono">Action</th>
                  <th className="text-left p-3 font-mono">Enabled</th>
                  <th className="text-right p-3 font-mono">·</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
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
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded border text-xs font-mono uppercase tracking-widest ${actionTone(p.action)}`}
                      >
                        {p.action}
                      </span>
                    </td>
                    <td className="p-3">
                      <Switch checked={p.enabled} onCheckedChange={(v) => toggle(p, v)} />
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
