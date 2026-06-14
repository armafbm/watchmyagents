import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2, KeyRound, ShieldAlert, Plus, RefreshCcw,
  CheckCircle2, XCircle, Clock, AlertOctagon, Copy, Check,
} from "lucide-react";
import {
  listSigningKeys,
  revokeSigningKey,
  backfillSignPolicies,
  claimFirstOperator,
} from "@/lib/fortress-signing.functions";
import { MintKeyWizard } from "@/components/operator/MintKeyWizard";

export const Route = createFileRoute("/_admin/admin/signing-keys")({
  head: () => ({ meta: [{ title: "Signing Keys — WMA Admin" }] }),
  component: SigningKeysAdminPage,
});

type KeyRow = Awaited<ReturnType<typeof listSigningKeys>>["keys"][number];

function keyStatus(k: KeyRow): { label: string; color: string; icon: React.ComponentType<any> } {
  if (k.revoked_at) return { label: "Révoquée", color: "#FF2D2D", icon: XCircle };
  const now = Date.now();
  const from = new Date(k.valid_from).getTime();
  const until = new Date(k.valid_until).getTime();
  if (now < from) return { label: "Planifiée", color: "#6B7280", icon: Clock };
  if (now >= until) return { label: "Expirée", color: "#FF8C00", icon: AlertOctagon };
  return { label: "Active", color: "#00C851", icon: CheckCircle2 };
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-white/10 transition-colors text-white/30 hover:text-white/70">
      {copied ? <Check className="h-3 w-3 text-[#00C851]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function SigningKeysAdminPage() {
  const fetchList = useServerFn(listSigningKeys);
  const callRevoke = useServerFn(revokeSigningKey);
  const callBackfill = useServerFn(backfillSignPolicies);
  const callClaim = useServerFn(claimFirstOperator);

  const [data, setData] = useState<Awaited<ReturnType<typeof listSigningKeys>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const [confirmKid, setConfirmKid] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetchList();
      setData(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const onRevoke = async (kid: string) => {
    setBusy(true);
    try {
      const r = await callRevoke({ data: { kid } });
      toast.success(`Révoquée — ${r.affected_policies} politiques · ${r.affected_customers} clients impactés`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Révocation échouée");
    } finally {
      setBusy(false);
      setConfirmKid(null);
    }
  };

  const onBackfill = async () => {
    setBusy(true);
    try {
      const r = await callBackfill();
      toast.success(`Backfill OK — ${r.signed} politiques signées avec ${r.kid}`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backfill échoué");
    } finally {
      setBusy(false);
    }
  };

  const onClaim = async () => {
    setBusy(true);
    try {
      await callClaim();
      toast.success("Rôle operator réclamé. Rechargement…");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec");
    } finally {
      setBusy(false);
    }
  };

  const unsigned = data?.unsigned_policies ?? 0;
  const rows = useMemo(() => data?.keys ?? [], [data]);
  const activeCount = rows.filter((k) => keyStatus(k).label === "Active").length;
  const revokedCount = rows.filter((k) => k.revoked_at).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
          <h1 className="text-xl font-semibold text-white">Signing Keys</h1>
          <p className="text-xs text-white/40 mt-0.5">
            Clés Ed25519 · Chaîne de confiance Fortress · SDK v1.1.5+ enforce
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reload} disabled={loading || busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-mono transition-colors disabled:opacity-40">
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setShowMint(true)} disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-colors disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" /> Mint signing key
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Clés totales", value: rows.length, color: "#0066FF", icon: KeyRound },
          { label: "Actives", value: activeCount, color: "#00C851", icon: CheckCircle2 },
          { label: "Révoquées", value: revokedCount, color: "#FF2D2D", icon: XCircle },
          { label: "Politiques non signées", value: unsigned, color: unsigned > 0 ? "#FF8C00" : "#6B7280", icon: ShieldAlert },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-[#0D0D14] px-5 py-4">
            <div className="flex items-center gap-2 text-white/40 mb-3">
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
            </div>
            <div className="font-mono text-2xl font-bold" style={{ color }}>{loading ? "—" : value}</div>
          </div>
        ))}
      </div>

      {/* Backfill Banner */}
      {!loading && unsigned > 0 && (
        <div className="rounded-xl border border-[#FF8C00]/20 bg-[#FF8C00]/5 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#FF8C00]">
              ⚠ {unsigned} politique{unsigned > 1 ? "s" : ""} non signée{unsigned > 1 ? "s" : ""}
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              Le SDK v1.1.5+ rejettera ces politiques. Lancer le backfill avec la clé active.
            </div>
          </div>
          <button
            onClick={onBackfill} disabled={busy}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF8C00] hover:bg-[#FF8C00]/80 text-black text-xs font-mono font-bold transition-colors disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Backfill maintenant
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-mono">Chargement…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <KeyRound className="h-8 w-8 text-white/10 mx-auto mb-3" />
            <div className="text-sm text-white/30 font-mono">Aucune signing key.</div>
            <div className="text-xs text-white/20 mt-1">Mint la première via la cérémonie root offline.</div>
            <button
              onClick={onClaim} disabled={busy}
              className="mt-4 px-4 py-2 rounded-lg border border-white/10 text-white/40 hover:text-white/70 text-xs font-mono transition-colors">
              {busy ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
              Réclamer le rôle operator
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                {["KID", "Statut", "Valide du", "Au", "Politiques signées", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-white/30 first:pl-5 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((k, i) => {
                const s = keyStatus(k);
                const Icon = s.icon;
                return (
                  <tr key={k.kid} className={`hover:bg-white/3 transition-colors ${i < rows.length - 1 ? "border-b border-white/5" : ""} ${k.revoked_at ? "opacity-50" : ""}`}>
                    <td className="pl-5 pr-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-white">{k.kid}</span>
                        <CopyBtn text={k.kid} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                        <span className="font-mono text-xs font-semibold" style={{ color: s.color }}>{s.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40 font-mono">
                      {new Date(k.valid_from).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40 font-mono">
                      {new Date(k.valid_until).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-white">{k.policy_count}</td>
                    <td className="px-4 py-3 pr-5">
                      {!k.revoked_at && (
                        confirmKid === k.kid ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onRevoke(k.kid)} disabled={busy}
                              className="px-3 py-1 text-[11px] font-mono rounded bg-[#FF2D2D]/10 border border-[#FF2D2D]/20 text-[#FF2D2D] hover:bg-[#FF2D2D]/20 transition-colors disabled:opacity-50">
                              {busy ? "…" : "Confirmer"}
                            </button>
                            <button
                              onClick={() => setConfirmKid(null)}
                              className="px-2 py-1 text-[11px] font-mono rounded border border-white/10 text-white/30 hover:text-white/60 transition-colors">
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmKid(k.kid)} disabled={busy}
                            className="px-3 py-1 text-[11px] font-mono rounded border border-white/10 text-white/30 hover:text-[#FF2D2D] hover:border-[#FF2D2D]/20 transition-colors">
                            Révoquer
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showMint && (
        <MintKeyWizard
          onClose={() => setShowMint(false)}
          onMinted={async () => { setShowMint(false); await reload(); }}
        />
      )}
    </div>
  );
}
