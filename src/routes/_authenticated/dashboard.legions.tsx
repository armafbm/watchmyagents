import { createFileRoute, Link } from "@tanstack/react-router";
import { Swords, Users, Activity, Plus, Eye, Brain, Shield as ShieldIcon, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { supabase } from "@/integrations/supabase/client";
import legionsHero from "@/assets/wma-legions-hero.png";

export const Route = createFileRoute("/_authenticated/dashboard/legions")({
  head: () => ({
    meta: [
      { title: "Legions · Agentic Fleet Management — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LegionsPage,
});

type LoopRow = {
  agent_id: string | null;
  display_name: string | null;
  signals_7d: number | null;
  suggestions_7d: number | null;
  suggestions_accepted_7d: number | null;
  decisions_7d: number | null;
  enforcements_7d: number | null;
};

function LegionsPage() {
  const [loops, setLoops] = useState<LoopRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("loop_overview_v")
      .select("*")
      .then(({ data }) => {
        setLoops((data as LoopRow[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const totalAgents = loops.length;
  const totalSignals = loops.reduce((s, l) => s + (l.signals_7d ?? 0), 0);
  const totalEnforced = loops.reduce((s, l) => s + (l.enforcements_7d ?? 0), 0);
  const totalDecisions = loops.reduce((s, l) => s + (l.decisions_7d ?? 0), 0);

  return (
    <DashboardLayout breadcrumb="Legions · Agentic Fleet Management">
      <div className="flex items-center gap-6 mb-2">
        <img
          src={legionsHero}
          alt="Legions banner"
          className="h-32 md:h-40 w-auto object-contain shrink-0 drop-shadow-[0_0_30px_oklch(0.78_0.18_220/0.35)] animate-float"
        />
        <div className="flex-1 min-w-0">
          <PageHeader
            kicker="Legions"
            title="Watch → Guardian → Shield, per agent."
            subtitle="A live 7-day view of the recursive security loop running across your fleet."
            actions={
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Register agent
              </Link>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Agents enlisted" value={String(totalAgents)} icon={Swords} tone="success" />
        <Stat label="Signals · 7d" value={totalSignals.toLocaleString()} icon={Activity} />
        <Stat label="Decisions · 7d" value={totalDecisions.toLocaleString()} icon={Users} />
        <Stat label="Enforcements · 7d" value={totalEnforced.toLocaleString()} icon={ShieldIcon} tone="warning" />
      </div>

      {loading ? (
        <Panel>
          <div className="py-12 text-center text-muted-foreground text-sm font-mono">Loading…</div>
        </Panel>
      ) : loops.length === 0 ? (
        <Panel title="Fleet roster" icon={Layers}>
          <div className="py-12 text-center">
            <Swords className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-display text-lg font-bold mb-1">No agent enlisted yet</div>
            <p className="text-sm text-muted-foreground mb-4">
              Register your first agent to start the Watch → Guardian → Shield loop.
            </p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Register agent
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="space-y-6">
          {loops.map((row) => (
            <LoopRowDiagram key={row.agent_id ?? row.display_name ?? Math.random()} row={row} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function LoopRowDiagram({ row }: { row: LoopRow }) {
  const signals = row.signals_7d ?? 0;
  const sugg = row.suggestions_7d ?? 0;
  const acc = row.suggestions_accepted_7d ?? 0;
  const dec = row.decisions_7d ?? 0;
  const enf = row.enforcements_7d ?? 0;

  return (
    <Panel
      title={row.display_name ?? "unnamed agent"}
      tag={`agent · 7d`}
      icon={Swords}
    >
      <div className="grid md:grid-cols-3 gap-4 items-stretch">
        <LoopNode color="primary" icon={Eye} label="Watch" value={signals} sub="signals" />
        <LoopNode color="accent" icon={Brain} label="Guardian" value={sugg} sub={`${acc} accepted`} />
        <LoopNode color="success" icon={ShieldIcon} label="Shield" value={enf} sub={`${dec} decisions`} />
      </div>
      <p className="mt-5 text-sm text-muted-foreground leading-relaxed text-center">
        <span className="text-foreground font-semibold">{row.display_name ?? "—"}</span> produced{" "}
        <span className="text-primary font-semibold">{signals}</span> signals · Guardian proposed{" "}
        <span className="text-accent font-semibold">{sugg}</span> policies (
        <span className="text-foreground font-semibold">{acc}</span> accepted) · Shield enforced{" "}
        <span className="text-success font-semibold">{enf}</span> of{" "}
        <span className="text-foreground font-semibold">{dec}</span> decisions.
      </p>
    </Panel>
  );
}

function LoopNode({
  color,
  icon: Icon,
  label,
  value,
  sub,
}: {
  color: "primary" | "accent" | "success";
  icon: typeof Eye;
  label: string;
  value: number;
  sub: string;
}) {
  const text =
    color === "primary" ? "text-primary" : color === "accent" ? "text-accent" : "text-success";
  const border =
    color === "primary"
      ? "border-primary/40"
      : color === "accent"
        ? "border-accent/40"
        : "border-success/40";
  return (
    <div
      className={`rounded-xl border-2 ${border} bg-background/40 p-5 flex flex-col items-center justify-center text-center min-h-[150px]`}
    >
      <Icon className={`h-6 w-6 ${text} mb-2`} />
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`font-display text-3xl font-bold ${text}`}>{value}</div>
      <div className="font-mono text-[10px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
