import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FortressShell } from "@/components/fortress/FortressShell";
import { Button } from "@/components/ui/button";
import { PolicyEditor, type PolicyDraft } from "@/components/fortress/PolicyEditor";

export const Route = createFileRoute("/_authenticated/suggestions")({
  head: () => ({ meta: [{ title: "Suggestions — Fortress" }, { name: "robots", content: "noindex" }] }),
  component: SuggestionsPage,
});

type Suggestion = {
  id: string;
  generated_at: string;
  title: string;
  rationale: string;
  proposed_action: string;
  proposed_match: unknown;
  proposed_message: string | null;
};

function actionTone(a: string) {
  if (a === "deny" || a === "block") return "bg-danger/15 text-danger border-danger/30";
  if (a === "interrupt") return "bg-warning/15 text-warning border-warning/30";
  return "bg-success/15 text-success border-success/30";
}

function SuggestionsPage() {
  const [list, setList] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<(PolicyDraft & { _from?: string }) | null>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .eq("status", "pending")
      .order("generated_at", { ascending: false });
    setList((data as Suggestion[] | null) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    reload();
  }, []);

  const accept = async (s: Suggestion) => {
    setBusy(s.id);
    const { data: u } = await supabase.auth.getUser();
    const customer_id = u.user!.id;
    const { data: pol, error } = await supabase
      .from("policies")
      .insert({
        rule_id: "guardian-" + s.id.slice(0, 8),
        name: s.title,
        rationale: s.rationale,
        match: s.proposed_match as never,
        action: s.proposed_action,
        message: s.proposed_message,
        suggested_by_guardian: true,
        suggestion_id: s.id,
        customer_id,
      })
      .select()
      .single();
    if (error || !pol) {
      setBusy(null);
      toast.error(error?.message ?? "Failed");
      return;
    }
    const { error: e2 } = await supabase
      .from("suggestions")
      .update({
        status: "accepted",
        applied_policy_id: pol.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", s.id);
    setBusy(null);
    if (e2) {
      toast.error(e2.message);
      return;
    }
    toast.success("Policy created from suggestion");
    reload();
  };

  const reject = async (s: Suggestion) => {
    setBusy(s.id);
    const { error } = await supabase
      .from("suggestions")
      .update({ status: "rejected", resolved_at: new Date().toISOString() })
      .eq("id", s.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else reload();
  };

  const modify = (s: Suggestion) => {
    setDraft({
      _from: s.id,
      rule_id: "guardian-" + s.id.slice(0, 8),
      name: s.title,
      rationale: s.rationale,
      action: s.proposed_action,
      message: s.proposed_message ?? "",
      match: JSON.stringify(s.proposed_match ?? {}, null, 2),
    });
  };

  const onSaved = async () => {
    const from = draft?._from;
    setDraft(null);
    if (from) {
      await supabase
        .from("suggestions")
        .update({ status: "accepted", resolved_at: new Date().toISOString() })
        .eq("id", from);
    }
    reload();
  };

  return (
    <FortressShell title="Suggestions">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Guardian inbox</h1>
        <p className="text-muted-foreground text-sm">
          Pending policy suggestions generated from anonymized signal analysis.
        </p>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-10 text-center text-muted-foreground text-sm">
          No pending suggestions. Guardian runs every 15 minutes.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                    {new Date(s.generated_at).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded border text-xs font-mono uppercase tracking-widest ${actionTone(s.proposed_action)}`}
                >
                  {s.proposed_action}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">{s.rationale}</p>
              <pre className="text-xs font-mono bg-background/60 border border-border/40 rounded-md p-3 overflow-x-auto mb-4">
                {JSON.stringify(s.proposed_match, null, 2)}
              </pre>
              <div className="flex gap-2">
                <Button onClick={() => accept(s)} disabled={busy === s.id}>
                  <Check className="h-4 w-4 mr-2" /> Accept
                </Button>
                <Button variant="outline" onClick={() => modify(s)} disabled={busy === s.id}>
                  <Pencil className="h-4 w-4 mr-2" /> Modify
                </Button>
                <Button variant="ghost" onClick={() => reject(s)} disabled={busy === s.id}>
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <PolicyEditor draft={draft} onClose={() => setDraft(null)} onSaved={onSaved} />
      )}
    </FortressShell>
  );
}
