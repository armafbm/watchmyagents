import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Copy, Check, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FortressShell } from "@/components/fortress/FortressShell";
import { Button } from "@/components/ui/button";
import { generateApiKey } from "@/lib/fortress-keys";

export const Route = createFileRoute("/_authenticated/settings/keys")({
  head: () => ({ meta: [{ title: "API Keys — Fortress" }, { name: "robots", content: "noindex" }] }),
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
    const { error } = await supabase
      .from("api_keys")
      .insert({ label: `Key ${new Date().toLocaleDateString()}`, prefix, hash });
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

  return (
    <FortressShell title="API Keys">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground text-sm">Used by your shield process to authenticate with Fortress.</p>
        </div>
        <Button onClick={create} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          New key
        </Button>
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

      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No API keys yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs font-mono uppercase tracking-widest text-muted-foreground bg-background/40">
              <tr>
                <th className="text-left px-4 py-3">Label</th>
                <th className="text-left px-4 py-3">Prefix</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Last used</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">·</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {list.map((k) => (
                <tr key={k.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 font-semibold">{k.label}</td>
                  <td className="px-4 py-3 font-mono text-xs">{k.prefix}…</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-right">
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
        )}
      </div>
    </FortressShell>
  );
}
