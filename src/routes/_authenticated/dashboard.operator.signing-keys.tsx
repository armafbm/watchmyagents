import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, KeyRound, ShieldAlert, Plus, RefreshCcw } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import {
  backfillSignPolicies,
  claimFirstOperator,
  listSigningKeys,
  revokeSigningKey,
} from "@/lib/fortress-signing.functions";
import { MintKeyWizard } from "@/components/operator/MintKeyWizard";

export const Route = createFileRoute("/_authenticated/dashboard/operator/signing-keys")({
  head: () => ({
    meta: [
      { title: "Signing Keys (Operator) — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SigningKeysPage,
});

type KeyRow = Awaited<ReturnType<typeof listSigningKeys>>["keys"][number];

function keyStatus(k: KeyRow): { label: string; tone: string } {
  if (k.revoked_at) return { label: "revoked", tone: "bg-danger/15 text-danger border-danger/30" };
  const now = Date.now();
  const from = new Date(k.valid_from).getTime();
  const until = new Date(k.valid_until).getTime();
  if (now < from) return { label: "scheduled", tone: "bg-muted text-muted-foreground border-border" };
  if (now >= until) return { label: "expired", tone: "bg-warning/15 text-warning border-warning/30" };
  return { label: "active", tone: "bg-success/15 text-success border-success/30" };
}

function SigningKeysPage() {
  const isOperator = useRole("operator");
  const fetchList = useServerFn(listSigningKeys);
  const callRevoke = useServerFn(revokeSigningKey);
  const callBackfill = useServerFn(backfillSignPolicies);
  const callClaim = useServerFn(claimFirstOperator);

  const [data, setData] = useState<Awaited<ReturnType<typeof listSigningKeys>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showMint, setShowMint] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetchList();
      setData(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load signing keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOperator) void reload();
    else if (isOperator === false) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOperator]);

  const onRevoke = async (kid: string) => {
    if (!confirm(`Revoke signing key ${kid}? Every policy signed by it will be dropped by all SDKs on the next refresh.`)) return;
    setBusy(true);
    try {
      const r = await callRevoke({ data: { kid } });
      toast.success(`Revoked ${kid} — ${r.affected_policies} policies / ${r.affected_customers} customers impacted`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setBusy(false);
    }
  };

  const onBackfill = async () => {
    setBusy(true);
    try {
      const r = await callBackfill();
      toast.success(`Signed ${r.signed} policies with ${r.kid}`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backfill failed");
    } finally {
      setBusy(false);
    }
  };

  const onClaim = async () => {
    setBusy(true);
    try {
      await callClaim();
      toast.success("You are now the first operator. Reload the page.");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  };

  const unsigned = data?.unsigned_policies ?? 0;
  const rows = useMemo(() => data?.keys ?? [], [data]);

  if (isOperator === null) {
    return (
      <DashboardLayout breadcrumb="Operator · Signing Keys">
        <Panel>
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking permissions…
          </div>
        </Panel>
      </DashboardLayout>
    );
  }

  if (isOperator === false) {
    return (
      <DashboardLayout breadcrumb="Operator · Signing Keys">
        <PageHeader
          kicker="Fortress"
          title="Signing Keys"
          subtitle="Operator-only — Ed25519 chain-of-trust for the Fortress SDK."
        />
        <Panel>
          <div className="py-10 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Operator role required</div>
              <div className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                This page manages the Fortress root chain-of-trust. If you're the first user setting it up, claim the role below — otherwise ask an existing operator to grant it.
              </div>
            </div>
            <Button onClick={onClaim} disabled={busy} variant="outline">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Claim first-operator role
            </Button>
          </div>
        </Panel>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumb="Operator · Signing Keys">
      <PageHeader
        kicker="Fortress · Chain-of-trust"
        title="Signing Keys"
        subtitle="Ed25519 keys chained to the offline root. Customer SDKs v1.1.5+ enforce this."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reload} disabled={loading || busy}>
              <RefreshCcw className="h-4 w-4 mr-1.5" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowMint(true)} disabled={busy}>
              <Plus className="h-4 w-4 mr-1.5" /> Mint signing key
            </Button>
          </div>
        }
      />

      {unsigned > 0 && (
        <Panel>
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="text-sm">
              <span className="font-semibold">{unsigned}</span> policy{unsigned > 1 ? "ies" : ""} unsigned.
              SDK v1.1.5+ will drop them. Run a backfill with the current active key.
            </div>
            <Button size="sm" onClick={onBackfill} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Backfill now
            </Button>
          </div>
        </Panel>
      )}

      <Panel>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <KeyRound className="h-8 w-8 mx-auto mb-3 opacity-50" />
            No signing keys yet. Mint the first one via the offline root ceremony.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="py-2 pr-4">kid</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Valid from</th>
                  <th className="py-2 pr-4">Valid until</th>
                  <th className="py-2 pr-4">Policies signed</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => {
                  const s = keyStatus(k);
                  return (
                    <tr key={k.kid} className="border-b border-border/30 last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{k.kid}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest ${s.tone}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {new Date(k.valid_from).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {new Date(k.valid_until).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">{k.policy_count}</td>
                      <td className="py-2 pr-4 text-right">
                        {!k.revoked_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRevoke(k.kid)}
                            disabled={busy}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {showMint && (
        <MintKeyWizard
          onClose={() => setShowMint(false)}
          onMinted={async () => {
            setShowMint(false);
            await reload();
          }}
        />
      )}
    </DashboardLayout>
  );
}
