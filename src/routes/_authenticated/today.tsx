import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Ban, Bot, Coins, Inbox, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FortressShell } from "@/components/fortress/FortressShell";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today — Fortress" }, { name: "robots", content: "noindex" }] }),
  component: TodayPage,
});

type TodayRow = {
  agents_active: number | null;
  tokens_24h: number | null;
  actions_24h: number | null;
  blocked_24h: number | null;
  suggestions_pending: number | null;
};

type Decision = {
  id: string;
  decided_at: string;
  decision: string;
  tool_name: string | null;
  message: string | null;
};

type Agent = {
  id: string;
  display_name: string;
  last_seen_at: string | null;
};

function fmt(n: number | null | undefined) {
  return (n ?? 0).toLocaleString();
}

function decisionIcon(d: string) {
  if (d === "allow") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (d === "deny" || d === "block") return <XCircle className="h-4 w-4 text-danger" />;
  return <AlertTriangle className="h-4 w-4 text-warning" />;
}

function TodayPage() {
  const [today, setToday] = useState<TodayRow | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: t }, { data: a }, { data: d }] = await Promise.all([
        supabase.from("dashboard_today_v").select("*").maybeSingle(),
        supabase.from("agents").select("id,display_name,last_seen_at").order("created_at").limit(1).maybeSingle(),
        supabase.from("decisions").select("id,decided_at,decision,tool_name,message").order("decided_at", { ascending: false }).limit(20),
      ]);
      if (!mounted) return;
      setToday((t as TodayRow | null) ?? { agents_active: 0, tokens_24h: 0, actions_24h: 0, blocked_24h: 0, suggestions_pending: 0 });
      setAgent(a as Agent | null);
      setDecisions((d as Decision[] | null) ?? []);
    })();

    const channel = supabase
      .channel("decisions-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "decisions" },
        (payload) => {
          setDecisions((prev) => [payload.new as Decision, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const online =
    agent?.last_seen_at && Date.now() - new Date(agent.last_seen_at).getTime() < 2 * 60_000;

  return (
    <FortressShell title="Today">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
            Daily check
          </div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            {agent?.display_name ?? "No agent yet"}
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                online ? "bg-success animate-blink" : "bg-muted-foreground/50"
              }`}
              title={online ? "Shield online" : "Offline"}
            />
          </h1>
        </div>
      </div>

      {(today?.suggestions_pending ?? 0) > 0 && (
        <div className="mb-6 rounded-xl border border-warning/40 bg-warning/[0.06] p-4 flex items-center gap-4">
          <Inbox className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1 text-sm">
            You have <span className="font-semibold text-warning">{today?.suggestions_pending}</span>{" "}
            pending Guardian suggestion(s) to review.
          </div>
          <Link
            to="/suggestions"
            className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-warning/60 text-warning hover:bg-warning/10"
          >
            Review
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric icon={Activity} label="Actions (24h)" value={fmt(today?.actions_24h)} />
        <Metric icon={Ban} label="Blocked (24h)" value={fmt(today?.blocked_24h)} tone="danger" />
        <Metric icon={Bot} label="Active agents" value={fmt(today?.agents_active)} />
        <Metric icon={Coins} label="Tokens (24h)" value={fmt(today?.tokens_24h)} />
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="font-semibold">Live timeline</h2>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-blink" />
            realtime
          </span>
        </div>
        <ul className="divide-y divide-border/40">
          {decisions.length === 0 && (
            <li className="px-5 py-8 text-sm text-muted-foreground text-center">
              No decisions yet. Once your shield runs, decisions will appear here in realtime.
            </li>
          )}
          {decisions.map((d) => (
            <li key={d.id} className="px-5 py-3 grid grid-cols-[auto_80px_1fr] gap-3 items-center">
              {decisionIcon(d.decision)}
              <span className="font-mono text-[11px] text-muted-foreground">
                {new Date(d.decided_at).toLocaleTimeString()}
              </span>
              <div className="min-w-0">
                <span className="font-mono text-xs text-primary">{d.tool_name ?? "—"}</span>
                <span className="text-sm text-muted-foreground"> · {d.message ?? d.decision}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </FortressShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${tone === "danger" ? "text-danger" : "text-primary"}`} />
      </div>
      <div
        className={`font-display text-3xl font-bold ${tone === "danger" ? "text-danger" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
