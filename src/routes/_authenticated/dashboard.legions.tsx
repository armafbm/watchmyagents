import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Swords,
  Users,
  Activity,
  Plus,
  Eye,
  Brain,
  Shield as ShieldIcon,
  AlertTriangle,
  ChevronDown,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PolicyEditor, type PolicyDraft } from "@/components/fortress/PolicyEditor";
import {
  getFleetData,
  type FleetLegion,
  type FleetAgent,
} from "@/lib/dashboard.functions";
import { supabase } from "@/integrations/supabase/client";
import legionsHero from "@/assets/wma-legions-hero.png";

export const Route = createFileRoute("/_authenticated/dashboard/legions")({
  head: () => ({
    meta: [
      { title: "Legions · Fleet Management — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LegionsPage,
});

// ----------------------------------------------------------------
// Fleet health
// ----------------------------------------------------------------
function fleetHealth(agents: FleetAgent[]): "operational" | "degraded" | "critical" | "empty" {
  if (agents.length === 0) return "empty";
  const active = agents.filter((a) => a.status === "active").length;
  const ratio = active / agents.length;
  if (ratio === 1) return "operational";
  if (ratio >= 0.5) return "degraded";
  return "critical";
}

const HEALTH_COLOR = {
  operational: "bg-success",
  degraded: "bg-warning",
  critical: "bg-danger",
  empty: "bg-muted-foreground/30",
} as const;

const HEALTH_LABEL = {
  operational: "operational",
  degraded: "degraded",
  critical: "critical",
  empty: "no agents",
} as const;

// ----------------------------------------------------------------
// Create fleet inline form
// ----------------------------------------------------------------
function CreateFleetForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const customer_id = u.user!.id;
    const { error } = await (supabase as any).from("legions")
      .insert({ name: name.trim(), description: description.trim() || null, customer_id });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setDescription("");
    onCreated();
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 flex-wrap">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Fleet name…"
        className="h-8 w-44 text-sm"
        maxLength={64}
        required
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="h-8 w-56 text-sm"
        maxLength={256}
      />
      <Button type="submit" size="sm" disabled={busy || !name.trim()}>
        {busy ? "Creating…" : "Create fleet"}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------------
// Agent assign dropdown
// ----------------------------------------------------------------
function AssignDropdown({
  agent,
  legions,
  onAssigned,
}: {
  agent: FleetAgent;
  legions: FleetLegion[];
  onAssigned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const assign = async (legionId: string | null) => {
    setBusy(true);
    setOpen(false);
    const { error } = await (supabase.from("agents") as any)
      .update({ legion_id: legionId })
      .eq("id", agent.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else onAssigned();
  };

  const opts = [
    { id: null, label: "Unassigned" },
    ...legions.map((l) => ({ id: l.id, label: l.name })),
  ].filter((o) => o.id !== agent.legion_id);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border/60 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
      >
        {busy ? "…" : "move"} <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 min-w-[140px] rounded-lg border border-border bg-card shadow-lg py-1">
          {opts.map((o) => (
            <button
              key={String(o.id)}
              onClick={() => assign(o.id)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-primary/10 font-mono text-[11px]"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Fleet card
// ----------------------------------------------------------------
function FleetCard({
  legion,
  agents,
  allLegions,
  onRefresh,
  onDeployPolicy,
  onDelete,
}: {
  legion: FleetLegion;
  agents: FleetAgent[];
  allLegions: FleetLegion[];
  onRefresh: () => void;
  onDeployPolicy: (legionId: string) => void;
  onDelete: (legion: FleetLegion) => void;
}) {
  const health = fleetHealth(agents);
  const signals7d = agents.reduce((s, a) => s + a.signals_7d, 0);
  const decisions7d = agents.reduce((s, a) => s + a.decisions_7d, 0);
  const enforcements7d = agents.reduce((s, a) => s + a.enforcements_7d, 0);

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${HEALTH_COLOR[health]}`} />
          <div className="min-w-0">
            <div className="font-display text-base font-bold truncate">{legion.name}</div>
            {legion.description && (
              <div className="text-xs text-muted-foreground truncate">{legion.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDeployPolicy(legion.id)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] uppercase tracking-widest hover:bg-primary/20 transition"
          >
            <ShieldIcon className="h-3 w-3" /> Deploy policy
          </button>
          <button
            onClick={() => onDelete(legion)}
            className="h-8 w-8 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-danger hover:border-danger/40 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-4 flex-wrap">
        <span>
          <span className="text-foreground font-semibold">{agents.length}</span> agent{agents.length !== 1 ? "s" : ""}
        </span>
        <span className={health === "empty" ? "text-muted-foreground/60" : HEALTH_COLOR[health].replace("bg-", "text-")}>
          {HEALTH_LABEL[health]}
        </span>
        <span><Eye className="h-3 w-3 inline mr-0.5" />{signals7d} signals</span>
        <span><Brain className="h-3 w-3 inline mr-0.5" />{decisions7d} decisions</span>
        <span><ShieldIcon className="h-3 w-3 inline mr-0.5" />{enforcements7d} enforced</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {agents.map((a) => (
          <div
            key={a.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-background/40 text-xs"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${a.status === "active" ? "bg-success animate-blink" : "bg-muted-foreground/40"}`}
            />
            <span className="font-medium truncate max-w-[120px]">{a.display_name}</span>
            <AssignDropdown agent={a} legions={allLegions} onAssigned={onRefresh} />
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-xs text-muted-foreground/60 italic">No agents in this fleet yet. Move an agent here using the "move" control below.</p>
        )}
      </div>
    </Panel>
  );
}

// ----------------------------------------------------------------
// Main page
// ----------------------------------------------------------------
function LegionsPage() {
  const { user, loading: authLoading } = useAuth();
  const fetchFleet = useServerFn(getFleetData);
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deployTarget, setDeployTarget] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["fleet-data", user?.id],
    enabled: !authLoading && !!user?.id,
    queryFn: () => fetchFleet(),
    retry: 1,
    staleTime: 20_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["fleet-data", user?.id] });

  const legions = query.data?.legions ?? [];
  const allAgents = query.data?.agents ?? [];
  const assignedIds = new Set(allAgents.filter((a) => a.legion_id).map((a) => a.id));
  const unassigned = allAgents.filter((a) => !a.legion_id);

  const totalSignals = allAgents.reduce((s, a) => s + a.signals_7d, 0);
  const totalEnforced = allAgents.reduce((s, a) => s + a.enforcements_7d, 0);

  const deleteFleet = async (legion: FleetLegion) => {
    if (!confirm(`Delete fleet "${legion.name}"? Agents will be unassigned.`)) return;
    const { error } = await (supabase as any).from("legions").delete().eq("id", legion.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const deployDraft: PolicyDraft = deployTarget
    ? { surface_type: "fleet", surface_ref: deployTarget }
    : {};

  return (
    <DashboardLayout breadcrumb="Legions · Fleet Management">
      {query.error && (
        <div className="mb-6 rounded-xl border border-danger/40 bg-danger/[0.06] p-4 flex items-center gap-4">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <div className="flex-1 text-sm font-semibold">Couldn't load fleet data.</div>
          <button
            onClick={refresh}
            className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-danger/60 text-danger hover:bg-danger/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-6 mb-4">
        <img
          src={legionsHero}
          alt="Legions banner"
          className="h-28 md:h-36 w-auto object-contain shrink-0 drop-shadow-[0_0_30px_oklch(0.78_0.18_220/0.35)] animate-float"
        />
        <div className="flex-1 min-w-0">
          <PageHeader
            kicker="Legions"
            title="Organize, group, deploy."
            subtitle="Create named fleets, assign agents to them, and deploy Shield policies fleet-wide."
            actions={
              creating ? (
                <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" /> New fleet
                </Button>
              )
            }
          />
          {creating && (
            <div className="mt-3">
              <CreateFleetForm
                onCreated={() => {
                  setCreating(false);
                  refresh();
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Fleets" value={String(legions.length)} icon={Swords} tone="success" />
        <Stat label="Total agents" value={String(allAgents.length)} icon={Users} />
        <Stat label="Signals · 7d" value={totalSignals.toLocaleString()} icon={Activity} />
        <Stat label="Enforced · 7d" value={totalEnforced.toLocaleString()} icon={ShieldIcon} tone={totalEnforced > 0 ? "warning" : undefined} />
      </div>

      {/* Fleet cards */}
      {query.isLoading ? (
        <Panel>
          <div className="py-12 text-center text-muted-foreground text-sm font-mono">Loading fleets…</div>
        </Panel>
      ) : legions.length === 0 && !creating ? (
        <Panel>
          <div className="py-12 text-center">
            <Swords className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-display text-lg font-bold mb-1">No fleet yet</div>
            <p className="text-sm text-muted-foreground mb-4">
              Create a fleet to group agents and deploy policies fleet-wide.
            </p>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create your first fleet
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4 mb-6">
          {legions.map((legion) => (
            <FleetCard
              key={legion.id}
              legion={legion}
              agents={allAgents.filter((a) => a.legion_id === legion.id)}
              allLegions={legions}
              onRefresh={refresh}
              onDeployPolicy={(id) => setDeployTarget(id)}
              onDelete={deleteFleet}
            />
          ))}
        </div>
      )}

      {/* Unassigned agents */}
      {unassigned.length > 0 && (
        <Panel
          title="Unassigned agents"
          tag={String(unassigned.length)}
          icon={Users}
        >
          <p className="text-xs text-muted-foreground mb-4">
            These agents don't belong to any fleet. Use the "move" control to assign them.
          </p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((a) => (
              <div
                key={a.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-background/40 text-xs"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${a.status === "active" ? "bg-success animate-blink" : "bg-muted-foreground/40"}`}
                />
                <span className="font-medium truncate max-w-[120px]">{a.display_name}</span>
                <AssignDropdown agent={a} legions={legions} onAssigned={refresh} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Link to WGS loop view */}
      {allAgents.length > 0 && (
        <div className="mt-4 text-center">
          <Link
            to="/dashboard/legions"
            className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            ↑ WGS loop view per agent still available below
          </Link>
        </div>
      )}

      {/* Policy editor overlay */}
      {deployTarget && (
        <PolicyEditor
          draft={deployDraft}
          onClose={() => setDeployTarget(null)}
          onSaved={() => {
            setDeployTarget(null);
            toast.success("Policy deployed to fleet.");
          }}
        />
      )}
    </DashboardLayout>
  );
}
