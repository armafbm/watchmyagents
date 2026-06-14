import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getAdminApiKeys, revokeAdminApiKey, type AdminApiKey } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/operator")({
  head: () => ({ meta: [{ title: "API Keys — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminOperatorPage,
});

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AdminOperatorPage() {
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showRevoked, setShowRevoked] = useState(false);

  useEffect(() => {
    getAdminApiKeys().then((k) => { setKeys(k); setLoading(false); });
  }, []);

  const revoke = async (keyId: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    setRevoking(keyId);
    try {
      await revokeAdminApiKey({ data: { keyId } });
      setKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k)),
      );
      toast.success("Key revoked");
    } catch {
      toast.error("Failed to revoke key");
    } finally {
      setRevoking(null);
    }
  };

  const filtered = keys.filter((k) => {
    if (!showRevoked && k.revoked_at) return false;
    const q = search.toLowerCase();
    return (
      k.customer_email.toLowerCase().includes(q) ||
      k.label.toLowerCase().includes(q) ||
      k.prefix.toLowerCase().includes(q)
    );
  });

  const activeCount = keys.filter((k) => !k.revoked_at).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">Platform</div>
          <h1 className="text-xl font-semibold">
            API Keys{" "}
            {!loading && (
              <span className="text-muted-foreground font-normal text-base">
                ({activeCount} active / {keys.length} total)
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRevoked}
              onChange={(e) => setShowRevoked(e.target.checked)}
              className="rounded"
            />
            Show revoked
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter keys…"
              className="pl-8 pr-4 py-1.5 text-sm bg-muted/30 border border-border/60 rounded-lg outline-none focus:border-primary/60 w-48"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-mono">Loading keys…</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                {[
                  ["Customer", "text-left px-5"],
                  ["Label / Prefix", "text-left px-4"],
                  ["Scopes", "text-left px-4"],
                  ["Created", "text-right px-4"],
                  ["Last Used", "text-right px-4"],
                  ["Status", "text-center px-4"],
                  ["", "text-right px-5"],
                ].map(([h, cls]) => (
                  <th key={h} className={`font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-3 ${cls}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground font-mono">
                    No keys found.
                  </td>
                </tr>
              ) : (
                filtered.map((key, i) => (
                  <tr
                    key={key.id}
                    className={`hover:bg-muted/10 transition-colors ${key.revoked_at ? "opacity-50" : ""} ${i < filtered.length - 1 ? "border-b border-border/40" : ""}`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {key.customer_email}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-sm">{key.label || "—"}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{key.prefix}…</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((s) => (
                          <span key={s} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted/40 border border-border/60 text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-muted-foreground font-mono">
                      {new Date(key.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-muted-foreground font-mono">
                      {timeAgo(key.last_used_at)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {key.revoked_at ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-destructive">
                          <XCircle className="h-3 w-3" /> revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!key.revoked_at && (
                        <button
                          onClick={() => revoke(key.id)}
                          disabled={revoking === key.id}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
                        >
                          {revoking === key.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
