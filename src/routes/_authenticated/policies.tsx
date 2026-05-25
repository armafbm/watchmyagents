import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FortressShell } from "@/components/fortress/FortressShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PolicyEditor, type PolicyDraft } from "@/components/fortress/PolicyEditor";

export const Route = createFileRoute("/_authenticated/policies")({
  head: () => ({ meta: [{ title: "Policies — Fortress" }, { name: "robots", content: "noindex" }] }),
  component: PoliciesPage,
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

function PoliciesPage() {
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

  return (
    <FortressShell title="Policies">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Policies</h1>
          <p className="text-muted-foreground text-sm">Rules enforced by Shield in front of your agents.</p>
        </div>
        <Button onClick={() => setEditing({} as PolicyDraft)}>
          <Plus className="h-4 w-4 mr-2" /> New policy
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            No policies yet. Create one or accept a Guardian suggestion.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs font-mono uppercase tracking-widest text-muted-foreground bg-background/40">
              <tr>
                <th className="text-left px-4 py-3">Rule</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Enabled</th>
                <th className="text-right px-4 py-3">·</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded border border-border/60 bg-background/60">
                      {p.rule_id}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{p.name}</div>
                    {p.suggested_by_guardian && (
                      <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
                        guardian
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded border text-xs font-mono uppercase tracking-widest ${actionTone(p.action)}`}
                    >
                      {p.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Switch checked={p.enabled} onCheckedChange={(v) => toggle(p, v)} />
                  </td>
                  <td className="px-4 py-3 text-right">
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
        )}
      </div>

      {editing && (
        <PolicyEditor draft={editing} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </FortressShell>
  );
}
