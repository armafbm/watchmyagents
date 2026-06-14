import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAdminUsers, updateUserPlan, type AdminUser } from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({
    meta: [{ title: "Users — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsersPage,
});

const PLANS = ["free", "pro", "pro_plus", "business", "advanced"];

const PLAN_COLORS: Record<string, string> = {
  free: "text-muted-foreground border-border/60",
  pro: "text-blue-400 border-blue-400/30",
  pro_plus: "text-violet-400 border-violet-400/30",
  business: "text-amber-400 border-amber-400/30",
  advanced: "text-emerald-400 border-emerald-400/30",
};

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    getAdminUsers().then((u) => {
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const changePlan = async (customerId: string, plan: string) => {
    setUpdating(customerId);
    try {
      await updateUserPlan({ data: { customerId, plan } });
      setUsers((prev) => prev.map((u) => (u.id === customerId ? { ...u, plan } : u)));
      toast.success("Plan updated");
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
          Platform
        </div>
        <h1 className="text-xl font-semibold">
          Users{" "}
          {!loading && (
            <span className="text-muted-foreground font-normal text-base">({users.length})</span>
          )}
        </h1>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-mono">Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground font-mono">
            No users yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                {["User", "Plan", "Agents", "Decisions 30d", "Joined"].map((h, i) => (
                  <th
                    key={h}
                    className={`font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-3 ${
                      i === 0 ? "text-left px-5" : i === 1 ? "text-left px-4" : "text-right px-4 last:px-5"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={`hover:bg-muted/10 transition-colors ${
                    i < users.length - 1 ? "border-b border-border/40" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{user.display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="relative inline-flex items-center">
                      <select
                        value={user.plan}
                        disabled={updating === user.id}
                        onChange={(e) => changePlan(user.id, e.target.value)}
                        className={`font-mono text-xs border rounded px-2 py-1 bg-transparent cursor-pointer appearance-none pr-5 disabled:opacity-50 ${
                          PLAN_COLORS[user.plan] ?? ""
                        }`}
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p} className="bg-background text-foreground">
                            {p}
                          </option>
                        ))}
                      </select>
                      {updating === user.id && (
                        <Loader2 className="absolute right-1 h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono text-sm">{user.agent_count}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm">{user.decisions_30d}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-muted-foreground font-mono">
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
