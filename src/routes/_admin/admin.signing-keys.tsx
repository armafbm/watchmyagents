import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trash2, ShieldCheck, ShieldOff, Clock } from "lucide-react";
import { toast } from "sonner";
import { getAdminSigningKeys, revokeAdminSigningKey, type AdminSigningKey } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/signing-keys")({
  head: () => ({ meta: [{ title: "Signing Keys — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSigningKeysPage,
});

type KeyStatus = "active" | "expired" | "revoked" | "upcoming";

function getStatus(key: AdminSigningKey): KeyStatus {
  if (key.revoked_at) return "revoked";
  const now = Date.now();
  const from = new Date(key.valid_from).getTime();
  const until = new Date(key.valid_until).getTime();
  if (now < from) return "upcoming";
  if (now > until) return "expired";
  return "active";
}

const STATUS_CONFIG: Record<KeyStatus, { label: string; icon: typeof ShieldCheck; cls: string }> = {
  active: { label: "active", icon: ShieldCheck, cls: "text-emerald-400" },
  upcoming: { label: "upcoming", icon: Clock, cls: "text-blue-400" },
  expired: { label: "expired", icon: ShieldOff, cls: "text-muted-foreground" },
  revoked: { label: "revoked", icon: ShieldOff, cls: "text-destructive" },
};

function daysUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const d = Math.ceil(diff / 86400000);
  if (d < 0) return `${Math.abs(d)}d ago`;
  if (d === 0) return "today";
  return `in ${d}d`;
}

function AdminSigningKeysPage() {
  const [keys, setKeys] = useState<AdminSigningKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    getAdminSigningKeys().then((k) => { setKeys(k); setLoading(false); });
  }, []);

  const revoke = async (kid: string) => {
    if (!confirm(`Revoke signing key "${kid}"? All policies signed with this key will fail verification.`)) return;
    setRevoking(kid);
    try {
      await revokeAdminSigningKey({ data: { kid } });
      setKeys((prev) =>
        prev.map((k) => (k.kid === kid ? { ...k, revoked_at: new Date().toISOString() } : k)),
      );
      toast.success("Signing key revoked");
    } catch {
      toast.error("Failed to revoke signing key");
    } finally {
      setRevoking(null);
    }
  };

  const activeCount = keys.filter((k) => getStatus(k) === "active").length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">Platform</div>
        <h1 className="text-xl font-semibold">
          Signing Keys{" "}
          {!loading && (
            <span className="text-muted-foreground font-normal text-base">
              ({activeCount} active / {keys.length} total)
            </span>
          )}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Keys used to sign policy bundles. SDK verifies signatures against the public key chain.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-mono">Loading signing keys…</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground font-mono">
            No signing keys configured.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                {[
                  ["Key ID", "text-left px-5"],
                  ["Public Key (truncated)", "text-left px-4"],
                  ["Valid From", "text-right px-4"],
                  ["Expires", "text-right px-4"],
                  ["Root Signed By", "text-right px-4"],
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
              {keys.map((key, i) => {
                const status = getStatus(key);
                const { label, icon: Icon, cls } = STATUS_CONFIG[status];
                const isRevocable = status === "active" || status === "upcoming";
                return (
                  <tr
                    key={key.kid}
                    className={`hover:bg-muted/10 transition-colors ${["revoked", "expired"].includes(status) ? "opacity-50" : ""} ${i < keys.length - 1 ? "border-b border-border/40" : ""}`}
                  >
                    <td className="px-5 py-3.5 font-mono text-sm font-semibold">{key.kid}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground max-w-[200px] truncate">
                      {key.pubkey.slice(0, 40)}…
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono text-muted-foreground">
                      {new Date(key.valid_from).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-mono">
                      <span className={status === "active" && daysUntil(key.valid_until).startsWith("in") && parseInt(daysUntil(key.valid_until).replace("in ", "")) < 30 ? "text-amber-400" : "text-muted-foreground"}>
                        {new Date(key.valid_until).toLocaleDateString("fr-FR")}
                      </span>
                      <div className="text-[10px] text-muted-foreground/70">{daysUntil(key.valid_until)}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[11px] font-mono text-muted-foreground truncate max-w-[120px]">
                      {key.signed_by_root ? key.signed_by_root.slice(0, 16) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${cls}`}>
                        <Icon className="h-3 w-3" />
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isRevocable && (
                        <button
                          onClick={() => revoke(key.kid)}
                          disabled={revoking === key.kid}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
                        >
                          {revoking === key.kid ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && keys.some((k) => getStatus(k) === "active" && parseInt(daysUntil(k.valid_until).replace("in ", "")) < 30) && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-5 py-4 text-sm text-amber-400">
          Warning — one or more active signing keys expire within 30 days. Generate and deploy a new key before expiry to avoid policy verification failures.
        </div>
      )}
    </div>
  );
}
