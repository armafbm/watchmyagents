import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Activity,
  Plus,
  Shield as ShieldIcon,
  AlertTriangle,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  Server,
  ArrowRight,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PolicyEditor, type PolicyDraft } from "@/components/fortress/PolicyEditor";
import {
  getFleetData,
  type FleetRow,
  type TeamRow,
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

const CRITICALITY_COLOR: Record<string, string> = {
  low: "text-muted-foreground border-muted-foreground/30",
  medium: "text-warning border-warning/40",
  high: "text-orange-400 border-orange-400/40",
  critical: "text-danger border-danger/40",
};

const RUNTIME_LABEL: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  "claude-code": "Claude Code",
  agentcore: "AgentCore",
  generic: "Generic",
};

// ----------------------------------------------------------------
// Agent chip (draggable)
// ----------------------------------------------------------------
function AgentChip({ agent, disabled }: { agent: FleetAgent; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: agent.id,
    data: { agent },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-background/40 text-xs cursor-grab select-none transition ${
        isDragging ? "opacity-40" : "hover:border-primary/40"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
          agent.status === "active" ? "bg-success animate-pulse" : "bg-muted-foreground/40"
        }`}
      />
      <span className="font-medium truncate max-w-[120px]">{agent.display_name}</span>
    </div>
  );
}

// ----------------------------------------------------------------
// Assign-fleet dropdown (for unfleeted agents)
// ----------------------------------------------------------------
function AssignFleetDropdown({
  agent,
  fleets,
  onAssigned,
}: {
  agent: FleetAgent;
  fleets: FleetRow[];
  onAssigned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const assign = async (fleetId: string) => {
    setBusy(true);
    setOpen(false);
    const { error } = await (supabase as any)
      .from("agents")
      .update({ fleet_id: fleetId })
      .eq("id", agent.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else onAssigned();
  };

  if (fleets.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border/60 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/40 transition"
      >
        {busy ? "…" : "assign"}
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 min-w-[160px] rounded-lg border border-border bg-card shadow-lg py-1">
          {fleets.map((f) => (
            <button
              key={f.id}
              onClick={() => assign(f.id)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-primary/10 font-mono text-[11px] flex items-center gap-2"
            >
              <Server className="h-3 w-3 text-muted-foreground" />
              {f.name}
              <span className="text-muted-foreground/60 text-[9px] uppercase">{f.runtime}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Team edit panel
// ----------------------------------------------------------------
function TeamEditPanel({
  team,
  onClose,
  onSaved,
}: {
  team: TeamRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const [criticality, setCriticality] = useState(team.criticality);
  const [notes, setNotes] = useState(team.notes ?? "");
  const [tagInput, setTagInput] = useState(team.tags.join(", "));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await (supabase as any)
      .from("teams")
      .update({ name: name.trim(), description: description.trim() || null, criticality, notes: notes.trim() || null, tags })
      .eq("id", team.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Team updated.");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="flex-1 bg-background/70 backdrop-blur-sm" />
      <aside className="w-full max-w-md h-full bg-card/95 backdrop-blur-xl border-l border-border/60 flex flex-col shadow-2xl">
        <header className="flex items-center justify-between p-5 border-b border-border/40">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary mb-1">// Edit team</p>
            <h2 className="font-display text-lg font-bold">{team.name}</h2>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-md border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={256} />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Criticality</label>
            <select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as TeamRow["criticality"])}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-mono"
            >
              {["low", "medium", "high", "critical"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Tags (comma-separated)</label>
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="billing, prod, payments…" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="p-5 border-t border-border/40 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy || !name.trim()}>
            {busy ? "Saving…" : <><Check className="h-3.5 w-3.5 mr-1.5" />Save</>}
          </Button>
        </div>
      </aside>
    </div>
  );
}

// ----------------------------------------------------------------
// Team card (droppable)
// ----------------------------------------------------------------
function TeamCard({
  team,
  onEdit,
  onDelete,
  onDeployPolicy,
}: {
  team: TeamRow;
  onEdit: (t: TeamRow) => void;
  onDelete: (t: TeamRow) => void;
  onDeployPolicy: (teamId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `team-${team.id}`, data: { teamId: team.id } });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border transition p-3 ${
        isOver ? "border-primary/60 bg-primary/5" : "border-border/40 bg-background/20"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${CRITICALITY_COLOR[team.criticality]}`}>
            {team.criticality}
          </span>
          <span className="font-semibold text-sm truncate">{team.name}</span>
          {team.description && (
            <span className="text-xs text-muted-foreground truncate hidden md:inline">{team.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onDeployPolicy(team.id)}
            title="Deploy policy to team"
            className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
          >
            <ShieldIcon className="h-3 w-3" />
          </button>
          <button
            onClick={() => onEdit(team)}
            className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(team)}
            className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {team.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {team.tags.map((tag) => (
            <span key={tag} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-secondary/40 text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={`flex flex-wrap gap-1.5 min-h-[32px] rounded-lg p-1.5 transition ${isOver ? "bg-primary/10" : ""}`}>
        {team.agents.length === 0 ? (
          <span className="text-[11px] text-muted-foreground/50 italic self-center pl-1">
            {isOver ? "Drop agent here" : "No agents — drag one here"}
          </span>
        ) : (
          team.agents.map((a) => <AgentChip key={a.id} agent={a} />)
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Add team inline form
// ----------------------------------------------------------------
function AddTeamForm({ fleetId, onCreated }: { fleetId: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Session expired."); setBusy(false); return; }
    const { error } = await (supabase as any)
      .from("teams")
      .insert({ fleet_id: fleetId, customer_id: u.user.id, name: name.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setName("");
    onCreated();
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Team name…"
        className="h-7 text-xs w-44"
        maxLength={64}
        required
        autoFocus
      />
      <Button type="submit" size="sm" className="h-7 text-xs px-3" disabled={busy || !name.trim()}>
        {busy ? "…" : <><Check className="h-3 w-3 mr-1" />Create</>}
      </Button>
    </form>
  );
}

// ----------------------------------------------------------------
// Fleet card — READ-ONLY container, teams are the editable unit
// ----------------------------------------------------------------
function FleetCard({
  fleet,
  allAgents,
  onRefresh,
  onDeployPolicy,
  onDelete,
}: {
  fleet: FleetRow;
  allAgents: FleetAgent[];
  onRefresh: () => void;
  onDeployPolicy: (surfaceType: "fleet" | "team", id: string) => void;
  onDelete: (fleet: FleetRow) => void;
}) {
  const [open, setOpen] = useState(true);
  const [addingTeam, setAddingTeam] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamRow | null>(null);

  // All agents whose fleet_id matches this fleet
  const fleetAgents = allAgents.filter((a) => a.fleet_id === fleet.id);
  const health = fleetHealth(fleetAgents);
  const signals7d = fleetAgents.reduce((s, a) => s + a.signals_7d, 0);

  // Agents in this fleet but not yet in any team
  const teamMemberIds = new Set(fleet.teams.flatMap((t) => t.agents.map((a) => a.id)));
  const unteamedAgents = fleetAgents.filter((a) => !teamMemberIds.has(a.id));

  const deleteTeam = async (team: TeamRow) => {
    if (!confirm(`Delete team "${team.name}"?`)) return;
    const { error } = await (supabase as any).from("teams").delete().eq("id", team.id);
    if (error) toast.error(error.message);
    else onRefresh();
  };

  const { setNodeRef: setUnteamedRef, isOver: isOverUnteamed } = useDroppable({
    id: `fleet-${fleet.id}-unteamed`,
    data: { fleetId: fleet.id, unteamed: true },
  });

  return (
    <Panel>
      {/* Fleet header — read-only */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-5 w-5 grid place-items-center text-muted-foreground hover:text-foreground"
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${HEALTH_COLOR[health]}`} />
          <div className="min-w-0">
            <div className="font-display text-base font-bold truncate">{fleet.name}</div>
            {fleet.description && (
              <div className="text-xs text-muted-foreground truncate">{fleet.description}</div>
            )}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border/40 rounded px-1.5 py-0.5 shrink-0">
            {RUNTIME_LABEL[fleet.runtime] ?? fleet.runtime}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDeployPolicy("fleet", fleet.id)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary/10 border border-primary/30 text-primary font-mono text-[10px] uppercase tracking-widest hover:bg-primary/20 transition"
          >
            <ShieldIcon className="h-3 w-3" /> Fleet policy
          </button>
          <button
            onClick={() => onDelete(fleet)}
            className="h-8 w-8 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-danger hover:border-danger/40 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mb-3 flex-wrap">
        <span><span className="text-foreground font-semibold">{fleetAgents.length}</span> agent{fleetAgents.length !== 1 ? "s" : ""}</span>
        <span><span className="text-foreground font-semibold">{fleet.teams.length}</span> team{fleet.teams.length !== 1 ? "s" : ""}</span>
        <span className={health === "empty" ? "text-muted-foreground/50" : ""}>{HEALTH_LABEL[health]}</span>
        <span><Activity className="h-3 w-3 inline mr-0.5" />{signals7d} signals · 7d</span>
      </div>

      {open && (
        <>
          {/* Teams — the main manageable unit */}
          {fleet.teams.length === 0 && !addingTeam && (
            <div className="rounded-xl border border-dashed border-border/40 p-4 text-center mb-3">
              <p className="text-xs text-muted-foreground mb-2">No teams yet. Create one to start organizing agents.</p>
              <button
                onClick={() => setAddingTeam(true)}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Create first team
              </button>
            </div>
          )}

          <div className="space-y-2">
            {fleet.teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={setEditTeam}
                onDelete={deleteTeam}
                onDeployPolicy={(id) => onDeployPolicy("team", id)}
              />
            ))}
          </div>

          {/* Agents in fleet but not in any team (drop zone) */}
          {unteamedAgents.length > 0 && (
            <div
              ref={setUnteamedRef}
              className={`mt-2 rounded-xl border border-dashed p-3 transition ${
                isOverUnteamed ? "border-primary/60 bg-primary/5" : "border-border/30"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                In fleet · not in a team
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unteamedAgents.map((a) => <AgentChip key={a.id} agent={a} />)}
              </div>
            </div>
          )}

          {addingTeam ? (
            <AddTeamForm
              fleetId={fleet.id}
              onCreated={() => { setAddingTeam(false); onRefresh(); }}
            />
          ) : (
            fleet.teams.length > 0 && (
              <button
                onClick={() => setAddingTeam(true)}
                className="mt-3 flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add team
              </button>
            )
          )}
        </>
      )}

      {editTeam && (
        <TeamEditPanel
          team={editTeam}
          onClose={() => setEditTeam(null)}
          onSaved={() => { setEditTeam(null); onRefresh(); }}
        />
      )}
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
  const [deployTarget, setDeployTarget] = useState<{ type: "fleet" | "team"; id: string } | null>(null);
  const [activeAgent, setActiveAgent] = useState<FleetAgent | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const query = useQuery({
    queryKey: ["fleet-data", user?.id],
    enabled: !authLoading && !!user?.id,
    queryFn: () => fetchFleet(),
    retry: 1,
    staleTime: 20_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["fleet-data", user?.id] });

  const fleets = query.data?.fleets ?? [];
  const allAgents = query.data?.all_agents ?? [];
  const unfleetedAgents = query.data?.unfleeted_agents ?? [];

  const totalAgents = allAgents.length;
  const totalSignals = allAgents.reduce((s, a) => s + a.signals_7d, 0);
  const totalEnforced = allAgents.reduce((s, a) => s + a.enforcements_7d, 0);

  const deleteFleet = async (fleet: FleetRow) => {
    if (!confirm(`Delete fleet "${fleet.name}"? All teams will be removed. Agents won't be deleted.`)) return;
    const { error } = await (supabase as any).from("fleets").delete().eq("id", fleet.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveAgent(e.active.data.current?.agent as FleetAgent ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveAgent(null);
    const agent = e.active.data.current?.agent as FleetAgent | undefined;
    const over = e.over;
    if (!agent || !over) return;

    const overData = over.data.current as { teamId?: string; fleetId?: string; unteamed?: boolean } | undefined;

    if (overData?.teamId) {
      const targetFleet = fleets.find((f) => f.teams.some((t) => t.id === overData.teamId));
      if (!targetFleet) return;

      // Cross-fleet drag forbidden
      if (agent.fleet_id && agent.fleet_id !== targetFleet.id) {
        toast.error("Cannot move agent across fleets. Use 'assign' to change fleet first.");
        return;
      }

      // Auto-assign fleet if agent has none
      if (!agent.fleet_id) {
        await (supabase as any).from("agents").update({ fleet_id: targetFleet.id }).eq("id", agent.id);
      }

      await (supabase as any)
        .from("agent_team_membership")
        .upsert({ agent_id: agent.id, team_id: overData.teamId, assigned_by: "manual" });

      refresh();
    } else if (overData?.fleetId && overData?.unteamed) {
      // Drop on fleet unteamed zone — assign fleet, remove team memberships
      if (agent.fleet_id !== overData.fleetId) {
        await (supabase as any).from("agents").update({ fleet_id: overData.fleetId }).eq("id", agent.id);
      }
      await (supabase as any).from("agent_team_membership").delete().eq("agent_id", agent.id);
      refresh();
    }
  };

  const deployDraft: PolicyDraft = deployTarget
    ? { surface_type: deployTarget.type, surface_ref: deployTarget.id }
    : {};

  const { setNodeRef: setUnfleetedRef, isOver: isOverUnfleeted } = useDroppable({
    id: "unfleeted-pool",
    data: { unfleeted: true },
  });

  return (
    <DashboardLayout breadcrumb="Legions · Fleet Management">
      {query.error && (
        <div className="mb-6 rounded-xl border border-danger/40 bg-danger/[0.06] p-4 flex items-center gap-4">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <div className="flex-1 text-sm font-semibold">Couldn't load fleet data.</div>
          <button onClick={refresh} className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-danger/60 text-danger hover:bg-danger/10">
            Retry
          </button>
        </div>
      )}

      {/* Header — no "New fleet" here, fleets come from WMA API keys registered in Watch */}
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
            subtitle="Fleets are linked to your WMA API keys. Create teams within each fleet to organize agents and deploy targeted policies."
            actions={
              <Link
                to="/dashboard/watch"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-primary/40 text-primary bg-primary/10 font-mono text-xs uppercase tracking-widest hover:bg-primary/20 transition"
              >
                <Server className="h-3.5 w-3.5" /> Register fleet
              </Link>
            }
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Fleets" value={String(fleets.length)} icon={Server} tone="success" />
        <Stat label="Total agents" value={String(totalAgents)} icon={Users} />
        <Stat label="Signals · 7d" value={totalSignals.toLocaleString()} icon={Activity} />
        <Stat label="Enforced · 7d" value={totalEnforced.toLocaleString()} icon={ShieldIcon} tone={totalEnforced > 0 ? "warning" : undefined} />
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

        {/* Fleet cards */}
        {query.isLoading ? (
          <Panel>
            <div className="py-12 text-center text-muted-foreground text-sm font-mono">Loading fleets…</div>
          </Panel>
        ) : fleets.length === 0 ? (
          <Panel>
            <div className="py-12 text-center">
              <Server className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <div className="font-display text-lg font-bold mb-1">No fleet yet</div>
              <p className="text-sm text-muted-foreground mb-5">
                Fleets are created when you register a WMA API key in Watch.
                Each fleet corresponds to one deployment key.
              </p>
              <Link
                to="/dashboard/watch"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
              >
                <ArrowRight className="h-4 w-4" /> Go to Watch · Register fleet
              </Link>
            </div>
          </Panel>
        ) : (
          <div className="space-y-4 mb-6">
            {fleets.map((fleet) => (
              <FleetCard
                key={fleet.id}
                fleet={fleet}
                allAgents={allAgents}
                onRefresh={refresh}
                onDeployPolicy={(type, id) => setDeployTarget({ type, id })}
                onDelete={deleteFleet}
              />
            ))}
          </div>
        )}

        {/* Unfleeted agents — agents with no fleet_id at all */}
        {unfleetedAgents.length > 0 && (
          <Panel title="Agents not in any fleet" tag={String(unfleetedAgents.length)} icon={Users}>
            <p className="text-xs text-muted-foreground mb-3">
              These agents were registered before a fleet existed. Assign them to a fleet,
              then drag them into a team.
            </p>
            <div
              ref={setUnfleetedRef}
              className={`flex flex-wrap gap-2 min-h-[40px] rounded-xl border border-dashed p-3 transition ${
                isOverUnfleeted ? "border-primary/60 bg-primary/5" : "border-border/30"
              }`}
            >
              {unfleetedAgents.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5">
                  <AgentChip agent={a} />
                  <AssignFleetDropdown agent={a} fleets={fleets} onAssigned={refresh} />
                </div>
              ))}
            </div>
          </Panel>
        )}

        <DragOverlay>
          {activeAgent && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary bg-card shadow-lg text-xs font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${activeAgent.status === "active" ? "bg-success" : "bg-muted-foreground/40"}`} />
              {activeAgent.display_name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Policy editor overlay */}
      {deployTarget && (
        <PolicyEditor
          draft={deployDraft}
          onClose={() => setDeployTarget(null)}
          onSaved={() => {
            setDeployTarget(null);
            toast.success(`Policy deployed to ${deployTarget.type}.`);
          }}
        />
      )}
    </DashboardLayout>
  );
}
