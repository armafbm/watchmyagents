import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Brain, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FortressShell } from "@/components/fortress/FortressShell";

export const Route = createFileRoute("/_authenticated/loop")({
  head: () => ({ meta: [{ title: "Loop — Fortress" }, { name: "robots", content: "noindex" }] }),
  component: LoopPage,
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

function LoopPage() {
  const [loops, setLoops] = useState<LoopRow[]>([]);
  useEffect(() => {
    supabase.from("loop_overview_v").select("*").then(({ data }) => {
      setLoops((data as LoopRow[] | null) ?? []);
    });
  }, []);

  return (
    <FortressShell title="Loop">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
          Recursive Fractal Security Loop
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">
          Watch <span className="text-muted-foreground">→</span> Guardian{" "}
          <span className="text-muted-foreground">→</span> Shield
        </h1>
        <p className="text-muted-foreground">A live 7-day view of the loop running for each agent.</p>
      </div>

      {loops.length === 0 && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-8 text-center text-muted-foreground">
          No agents yet. Register one in onboarding to start the loop.
        </div>
      )}

      <div className="space-y-10">
        {loops.map((row) => (
          <LoopRowDiagram key={row.agent_id ?? row.display_name ?? Math.random()} row={row} />
        ))}
      </div>
    </FortressShell>
  );
}

function LoopRowDiagram({ row }: { row: LoopRow }) {
  const signals = row.signals_7d ?? 0;
  const sugg = row.suggestions_7d ?? 0;
  const acc = row.suggestions_accepted_7d ?? 0;
  const dec = row.decisions_7d ?? 0;
  const enf = row.enforcements_7d ?? 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-8">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">
        Agent · <span className="text-primary">{row.display_name ?? "unnamed"}</span>
      </div>

      <div className="relative grid md:grid-cols-3 gap-4 items-stretch loop-diagram">
        <LoopNode
          color="primary"
          icon={Eye}
          label="Watch"
          value={signals}
          sub="signals · 7d"
        />
        <LoopArrow />
        <LoopNode
          color="accent"
          icon={Brain}
          label="Guardian"
          value={sugg}
          sub={`suggestions · ${acc} accepted`}
        />
        <LoopArrow />
        <LoopNode
          color="success"
          icon={Shield}
          label="Shield"
          value={enf}
          sub={`enforcements · ${dec} decisions`}
        />
      </div>

      <p className="mt-6 text-sm text-muted-foreground leading-relaxed text-center">
        This week, your agent{" "}
        <span className="text-foreground font-semibold">{row.display_name ?? "—"}</span> generated{" "}
        <span className="text-primary font-semibold">{signals}</span> observations, Guardian proposed{" "}
        <span className="text-accent font-semibold">{sugg}</span> policies (you accepted{" "}
        <span className="text-foreground font-semibold">{acc}</span>), and Shield enforced{" "}
        <span className="text-success font-semibold">{enf}</span> decisions across{" "}
        <span className="text-foreground font-semibold">{dec}</span> actions.
      </p>

      <style>{`
        @keyframes loop-pulse {
          0%, 100% { opacity: .35; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(4px); }
        }
        .loop-arrow-dot {
          animation: loop-pulse 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
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
  const ring =
    color === "primary"
      ? "border-primary/50 shadow-[0_0_40px_oklch(0.78_0.18_220/0.25)]"
      : color === "accent"
        ? "border-accent/50 shadow-[0_0_40px_oklch(0.65_0.25_300/0.25)]"
        : "border-success/50 shadow-[0_0_40px_oklch(0.7_0.18_150/0.25)]";
  const text =
    color === "primary" ? "text-primary" : color === "accent" ? "text-accent" : "text-success";
  return (
    <div className={`relative rounded-2xl border-2 ${ring} bg-background/60 p-6 flex flex-col items-center justify-center text-center min-h-[180px]`}>
      <Icon className={`h-7 w-7 ${text} mb-2`} />
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`font-display text-4xl font-bold ${text}`}>{value}</div>
      <div className="font-mono text-[10px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function LoopArrow() {
  return (
    <div className="hidden md:flex absolute inset-y-0 items-center pointer-events-none" style={{ display: "none" }}>
      <div className="loop-arrow-dot text-primary">→</div>
    </div>
  );
}
