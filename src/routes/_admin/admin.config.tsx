import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2, Settings, Key, Shield, Users, ChevronDown, X, Check,
  Copy, RefreshCw, AlertTriangle,
} from "lucide-react";
import {
  getAdminUsers, getAdminApiKeys, getAdminSigningKeys,
  updateUserPlan, revokeAdminApiKey, revokeAdminSigningKey,
  type AdminUser, type AdminApiKey, type AdminSigningKey,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/config")({
  head: () => ({ meta: [{ title: "Super Admin — WMA Admin" }] }),
  component: SuperAdminPage,
});

type Tab = "users" | "apikeys" | "signingkeys";

const VALID_PLANS = ["free", "pro", "pro_plus", "business", "advanced"] as const;
const PLAN_COLOR: Record<string, string> = {
  free: "#6B7280", pro: "#3B82F6", pro_plus: "#8B5CF6", business: "#F59E0B", advanced: "#10B981",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "jamais";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d}j`;
  const h = Math.floor(diff / 3_600_000);
  return h > 0 ? `${h}h` : `${Math.floor(diff / 60_000)}m`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-white/10 transition-colors text-white/30 hover:text-white/70">
      {copied ? <Check className="h-3 w-3 text-[#00C851]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function UsersTab({ users, onRefresh }: { users: AdminUser[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || (u.display_name ?? "").toLowerCase().includes(q);
  });

  const handlePlanChange = async (userId: string, plan: string) => {
    setUpdating(userId);
    try { await updateUserPlan({ data: { customerId: userId, plan } }); onRefresh(); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur…"
          className="px-4 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/60 text-white placeholder:text-white/30 w-60" />
        <span className="text-xs text-white/30 font-mono">{filtered.length} utilisateur(s)</span>
      </div>
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              {["Utilisateur", "Plan", "Agents", "Décisions 30j", "Clés API", "Dernière activité"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-white/30 first:pl-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-white/30 text-sm font-mono">Aucun utilisateur.</td></tr>
            ) : filtered.map((u, i) => (
              <tr key={u.id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/5" : ""}`}>
                <td className="pl-5 pr-4 py-3">
                  <div className="text-white text-sm">{u.display_name ?? u.email}</div>
                  <div className="text-[10px] text-white/30 font-mono">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <select
                      disabled={updating === u.id}
                      value={u.plan}
                      onChange={(e) => handlePlanChange(u.id, e.target.value)}
                      className="appearance-none pl-2 pr-6 py-1 text-[11px] rounded-lg border border-white/10 bg-[#0D0D14] outline-none cursor-pointer font-mono"
                      style={{ color: PLAN_COLOR[u.plan] ?? "#fff" }}>
                      {VALID_PLANS.map((p) => (
                        <option key={p} value={p} style={{ color: PLAN_COLOR[p] }}>{p}</option>
                      ))}
                    </select>
                    {updating === u.id
                      ? <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-white/40" />
                      : <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 pointer-events-none" />
                    }
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-white">{u.agent_count}</td>
                <td className="px-4 py-3 font-mono text-sm text-white">{u.decisions_30d.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-sm text-white">{u.active_keys}</td>
                <td className="px-4 py-3 text-xs text-white/40 font-mono">{timeAgo(u.last_active)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApiKeysTab({ keys, onRevoke }: { keys: AdminApiKey[]; onRevoke: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [showRevoked, setShowRevoked] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = keys.filter((k) => {
    if (!showRevoked && k.revoked_at) return false;
    const q = search.toLowerCase();
    return !q || k.label.toLowerCase().includes(q) || k.customer_email.toLowerCase().includes(q) || k.prefix.toLowerCase().includes(q);
  });

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try { await revokeAdminApiKey({ data: { keyId: id } }); onRevoke(id); }
    finally { setRevoking(null); setConfirmId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une clé…"
          className="px-4 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/60 text-white placeholder:text-white/30 w-52" />
        <label className="flex items-center gap-2 cursor-pointer text-xs text-white/40 hover:text-white/70 transition-colors">
          <input type="checkbox" checked={showRevoked} onChange={(e) => setShowRevoked(e.target.checked)} className="accent-blue-500" />
          Afficher révoquées
        </label>
        <span className="text-xs text-white/30 font-mono">{filtered.length} clé(s)</span>
      </div>
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              {["Label / Préfixe", "Client", "Scopes", "Créée", "Dernière utilisation", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-white/30 first:pl-5 last:pr-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-white/30 text-sm font-mono">Aucune clé.</td></tr>
            ) : filtered.map((k, i) => (
              <tr key={k.id} className={`hover:bg-white/3 transition-colors ${k.revoked_at ? "opacity-50" : ""} ${i < filtered.length - 1 ? "border-b border-white/5" : ""}`}>
                <td className="pl-5 pr-4 py-3">
                  <div className="text-white text-sm">{k.label}</div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] text-white/30">{k.prefix}…</span>
                    <CopyBtn text={k.prefix} />
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-white/50 font-mono">{k.customer_email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(k.scopes ?? []).map((s) => (
                      <span key={s} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-blue-600/10 border border-blue-500/20 text-blue-400">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-white/40 font-mono">{timeAgo(k.created_at)}</td>
                <td className="px-4 py-3 text-xs text-white/40 font-mono">{timeAgo(k.last_used_at)}</td>
                <td className="px-4 py-3 pr-5">
                  {k.revoked_at ? (
                    <span className="text-[10px] text-[#FF2D2D]/60 font-mono">Révoquée</span>
                  ) : confirmId === k.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleRevoke(k.id)} disabled={revoking === k.id}
                        className="px-2 py-1 text-[10px] rounded bg-[#FF2D2D]/10 border border-[#FF2D2D]/20 text-[#FF2D2D] hover:bg-[#FF2D2D]/20 transition-colors disabled:opacity-50">
                        {revoking === k.id ? "…" : "Confirmer"}
                      </button>
                      <button onClick={() => setConfirmId(null)} className="p-1 text-white/30 hover:text-white/70">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(k.id)}
                      className="px-2 py-1 text-[10px] rounded border border-white/10 text-white/30 hover:text-[#FF2D2D] hover:border-[#FF2D2D]/20 transition-colors">
                      Révoquer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SigningKeysTab({ keys }: { keys: AdminSigningKey[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#FF8C00]/20 bg-[#FF8C00]/5 px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-[#FF8C00] shrink-0 mt-0.5" />
        <div className="text-xs text-[#FF8C00]/80">
          Les signing keys sont gérées via l'infrastructure Cloudflare Workers et le script de rotation.
          La révocation ici met à jour l'état dans la base de données publique.
        </div>
      </div>
      <div className="rounded-xl border border-white/8 bg-[#0D0D14] overflow-hidden">
        {keys.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm font-mono">Aucune signing key.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.map((k) => (
              <div key={k.kid} className={`px-5 py-4 ${k.revoked_at ? "opacity-40" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-white font-bold">{k.kid}</span>
                      <CopyBtn text={k.kid} />
                      {k.revoked_at
                        ? <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FF2D2D]/10 border border-[#FF2D2D]/20 text-[#FF2D2D]">Révoquée</span>
                        : <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#00C851]/10 border border-[#00C851]/20 text-[#00C851]">Active</span>
                      }
                    </div>
                    <div className="font-mono text-[10px] text-white/30 truncate max-w-md">{k.pubkey.slice(0, 60)}…</div>
                    <div className="text-[10px] text-white/30 mt-1 font-mono">
                      Valide : {new Date(k.valid_from).toLocaleDateString("fr-FR")} → {new Date(k.valid_until).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-white/20 font-mono">Signé par</div>
                    <div className="text-[10px] text-white/40 font-mono truncate max-w-[120px]">{k.signed_by_root.slice(0, 12)}…</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuperAdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [apiKeys, setApiKeys] = useState<AdminApiKey[]>([]);
  const [signingKeys, setSigningKeys] = useState<AdminSigningKey[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    setLoading(true);
    Promise.all([getAdminUsers(), getAdminApiKeys(), getAdminSigningKeys()]).then(([u, k, s]) => {
      setUsers(u); setApiKeys(k); setSigningKeys(s); setLoading(false);
    });
  };

  useEffect(() => { loadAll(); }, []);

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
  };

  const TABS: { id: Tab; label: string; icon: React.ComponentType<any>; count?: number }[] = [
    { id: "users", label: "Utilisateurs", icon: Users, count: users.length },
    { id: "apikeys", label: "API Keys", icon: Key, count: apiKeys.filter((k) => !k.revoked_at).length },
    { id: "signingkeys", label: "Signing Keys", icon: Shield, count: signingKeys.length },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-blue-400 mb-1">Watch My Agents</div>
          <h1 className="text-xl font-semibold text-white">Super Admin Config</h1>
          <p className="text-xs text-white/40 mt-0.5">Gestion des plans · Clés API · Signing Keys · Accès</p>
        </div>
        <button onClick={loadAll} disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-xs font-mono transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count !== undefined && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/40">{count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-white/30">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="font-mono text-sm">Chargement…</span>
        </div>
      ) : (
        <>
          {tab === "users" && <UsersTab users={users} onRefresh={loadAll} />}
          {tab === "apikeys" && <ApiKeysTab keys={apiKeys} onRevoke={handleRevokeKey} />}
          {tab === "signingkeys" && <SigningKeysTab keys={signingKeys} />}
        </>
      )}
    </div>
  );
}
