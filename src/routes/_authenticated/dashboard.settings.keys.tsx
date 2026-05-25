import { createFileRoute } from "@tanstack/react-router";
import { Plus, Copy, Check, Loader2, ShieldAlert, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { generateApiKey } from "@/lib/fortress-keys";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/settings/keys")({
  head: () => ({ meta: [{ title: "API Keys — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: KeysPage,
});

type ApiKey = {
  id: string;
  label: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

function KeysPage() {
  const [list, setList] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data as ApiKey[] | null) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    reload();
  }, []);

  const create = async () => {
    setBusy(true);
    const { key, hash, prefix } = await generateApiKey();
    const { data: u } = await supabase.auth.getUser();
    const customer_id = u.user!.id;
    const { error } = await supabase
      .from("api_keys")
      .insert({ label: `Key ${new Date().toLocaleDateString()}`, prefix, hash, customer_id });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewKey(key);
    reload();
  };

  const revoke = async (k: ApiKey) => {
    if (!confirm(`Revoke key "${k.label}"?`)) return;
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", k.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const activeCount = list.filter((k) => !k.revoked_at).length;
  const revokedCount = list.filter((k) => k.revoked_at).length;

  return (
    <DashboardLayout breadcrumb="Settings · API Keys">
      <PageHeader
        kicker="Settings"
        title="API Keys"
        subtitle="Used by your shield process to authenticate with Fortress. We only store SHA-256 hashes."
        actions={
          <Button onClick={create} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            New key
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Active keys" value={String(activeCount)} icon={KeyRound} tone="success" />
        <Stat label="Revoked" value={String(revokedCount)} tone="danger" />
        <Stat label="Total" value={String(list.length)} />
        <Stat label="Storage" value="hash-only" tone="success" />
      </div>

      {newKey && (
        <div className="mb-6 rounded-xl border border-warning/40 bg-warning/[0.06] p-5">
          <div className="flex items-start gap-3 mb-3">
            <ShieldAlert className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <div className="font-semibold text-warning">Your new key — shown only once</div>
              <div className="text-sm text-muted-foreground">
                Copy it now. We only keep its SHA-256 hash.
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-3 flex items-center gap-2">
            <code className="flex-1 font-mono text-sm break-all">{newKey}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(newKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setNewKey(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Panel title="Your keys" icon={KeyRound} tag={`${list.length} total`}>
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center">
            <KeyRound className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-display text-lg font-bold mb-1">No API key yet</div>
            <p className="text-sm text-muted-foreground mb-4">
              Generate one to let your shield process talk to Fortress.
            </p>
            <Button onClick={create} disabled={busy}>
              <Plus className="h-4 w-4 mr-2" /> Create your first key
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-mono">Label</th>
                  <th className="text-left p-3 font-mono">Prefix</th>
                  <th className="text-left p-3 font-mono">Created</th>
                  <th className="text-left p-3 font-mono">Last used</th>
                  <th className="text-left p-3 font-mono">Status</th>
                  <th className="text-right p-3 font-mono">·</th>
                </tr>
              </thead>
              <tbody>
                {list.map((k) => (
                  <tr key={k.id} className="border-t border-border/40 hover:bg-primary/5">
                    <td className="p-3 font-semibold">{k.label}</td>
                    <td className="p-3 font-mono text-xs">{k.prefix}…</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}
                    </td>
                    <td className="p-3">
                      {k.revoked_at ? (
                        <span className="px-2 py-0.5 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono uppercase tracking-widest">
                          revoked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded border border-success/30 bg-success/10 text-success text-xs font-mono uppercase tracking-widest">
                          active
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!k.revoked_at && (
                        <button
                          onClick={() => revoke(k)}
                          className="text-xs font-mono uppercase tracking-widest text-danger hover:underline"
                        >
                          Revoke
                        </button>
                      )}
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
