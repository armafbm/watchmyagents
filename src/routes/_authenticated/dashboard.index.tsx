import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Bot,
  Coins,
  Eye,
  FileText,
  GitPullRequest,
  Inbox,
  Radar,
  ScrollText,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import mascot from "@/assets/wma-shield-logo.png";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Panel, PageHeader, Stat } from "@/components/dashboard/primitives";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardSnapshot, type Decision } from "@/lib/dashboard.functions";
import { humanizeError } from "@/lib/error-formatting";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [{ title: "Command Center — WatchMyAgents" }, { name: "robots", content: "noindex" }],
  }),
  component: CommandCenter,
});

function fmt(n: number | null | undefined) {
  return (n ?? 0).toLocaleString();
}

function decisionIcon(d: string) {
  if (d === "allow") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (d === "deny" || d === "block") return <XCircle className="h-4 w-4 text-danger" />;
  return <AlertTriangle className="h-4 w-4 text-warning" />;
}

function CommandCenter() {
  const { user, loading: authLoading } = useAuth();
  const fetchDashboard = useServerFn(getDashboardSnapshot);
  const queryClient = useQueryClient();
  const uid = user?.id;

  const query = useQuery({
    queryKey: ["dashboard-snapshot", uid],
    enabled: !authLoading && !!uid,
    queryFn: () => fetchDashboard(),
    retry: 1,
    staleTime: 15_000,
  });

  // Realtime: push new decisions into the cache as they arrive.
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`user:${uid}`, { config: { private: true } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "decisions", filter: `customer_id=eq.${uid}` },
        (payload) => {
          queryClient.setQueryData<typeof query.data>(["dashboard-snapshot", uid], (prev) =>
            prev
              ? { ...prev, decisions: [payload.new as Decision, ...prev.decisions].slice(0, 8) }
              : prev,
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, queryClient]);

  const today = query.data?.today;
  const decisions = query.data?.decisions ?? [];
  const agents = query.data?.agents ?? [];
  const agentsActive = today?.agents_active ?? 0;
  const blocked = today?.blocked_24h ?? 0;
  const pending = today?.suggestions_pending ?? 0;

  const err = query.error ? humanizeError(query.error) : null;

  return (
    <DashboardLayout breadcrumb="Command Center">
      {err && (
        <div className="mb-6 rounded-xl border border-danger/40 bg-danger/[0.06] backdrop-blur p-4 flex items-center gap-4">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <div className="flex-1 text-sm">
            <div className="font-semibold">Couldn't load your fortress data.</div>
            <div className="text-muted-foreground text-xs mt-1">
              {err.message} Your agents and data are safe.
              {err.isFetchProxy && " If this is a preview deployment, try the published URL."}
            </div>
          </div>
          <button
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-danger/60 text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            {query.isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}
      {query.isLoading && !err && (
        <div className="mb-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Loading your fortress…
        </div>
      )}
      {pending > 0 && (
        <div className="mb-6 relative rounded-xl border border-warning/40 bg-warning/[0.06] backdrop-blur p-4 flex items-center gap-4">
          <Inbox className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">
              Guardian has {pending} pending suggestion{pending > 1 ? "s" : ""}.
            </span>{" "}
            <span className="text-muted-foreground">Review them to harden your shield.</span>
          </div>
          <Link
            to="/dashboard/guardian"
            className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md border border-warning/60 text-warning hover:bg-warning/10"
          >
            Review
          </Link>
        </div>
      )}

      <PageHeader
        kicker="Fortress · command center"
        title="Your AI agents. Under protection."
        subtitle="Realtime posture across every fleet. Watch detects, Shield enforces, Guardian explains."
        actions={
          <div className="hidden md:flex flex-col items-end gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-blink" />
              status: <span className="text-success">{agentsActive > 0 ? "secure" : "idle"}</span>
            </span>
            <span>region · eu-west-3</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Agents protected" value={fmt(agentsActive)} icon={Bot} />
        <Stat label="Actions · 24h" value={fmt(today?.actions_24h)} icon={Activity} />
        <Stat
          label="Blocked · 24h"
          value={fmt(blocked)}
          icon={Shield}
          tone={blocked > 0 ? "danger" : "success"}
        />
        <Stat label="Tokens · 24h" value={fmt(today?.tokens_24h)} icon={Coins} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Panel className="lg:col-span-2 overflow-hidden">
          <div className="relative grid sm:grid-cols-[1fr_auto] gap-6 items-center -m-1">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
                Sentinel.Knight · on watch
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">
                {agentsActive > 0 ? (
                  <>
                    Observing{" "}
                    <span className="text-gradient">
                      {agentsActive} agent{agentsActive > 1 ? "s" : ""}
                    </span>
                    .
                  </>
                ) : (
                  <>No agent connected yet.</>
                )}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {agentsActive > 0
                  ? `${fmt(today?.actions_24h)} actions · ${fmt(blocked)} blocked · last 24h.`
                  : "Register your first agent to start watching."}
              </p>
              <div className="flex flex-wrap gap-2">
                {agentsActive > 0 ? (
                  <>
                    <Pill icon={Zap} tone="primary">
                      {fmt(today?.actions_24h)} actions
                    </Pill>
                    <Pill icon={Eye} tone="success">
                      {agentsActive} online
                    </Pill>
                    {pending > 0 && (
                      <Pill icon={Shield} tone="warning">
                        {pending} pending
                      </Pill>
                    )}
                  </>
                ) : (
                  <Link
                    to="/onboarding"
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
                  >
                    Register an agent →
                  </Link>
                )}
              </div>
            </div>
            <div className="relative h-44 w-44 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse-ring" />
              <img
                src={mascot}
                alt="WatchMyAgents knight mascot"
                className="relative h-full w-full object-contain animate-float drop-shadow-[0_0_30px_oklch(0.78_0.18_220/0.45)]"
              />
            </div>
          </div>
        </Panel>

        <Panel title="Guardian inbox" tag="pending" icon={GitPullRequest}>
          <div className="text-center py-4">
            <div className="font-display text-5xl font-bold text-warning">{fmt(pending)}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
              suggestions waiting
            </div>
          </div>
          <Link
            to="/dashboard/guardian"
            className="mt-4 block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            open guardian inbox →
          </Link>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Panel
          title="Protected agents"
          icon={Bot}
          tag={`${agents.length}`}
          className="lg:col-span-2"
        >
          {agents.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">No agent registered yet.</p>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
              >
                Register an agent →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/40 -my-2">
              {agents.map((a) => (
                <li key={a.id} className="py-3 flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${a.status === "active" ? "bg-success animate-blink" : "bg-muted-foreground/50"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{a.display_name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {a.provider} · {a.status}
                      {a.last_seen_at
                        ? ` · last seen ${new Date(a.last_seen_at).toLocaleString()}`
                        : " · never seen"}
                    </div>
                  </div>
                  <Link
                    to="/dashboard/watch"
                    className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline"
                  >
                    view →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Quick actions" icon={Shield}>
          <div className="space-y-2">
            <Link
              to="/dashboard/shield"
              className="block rounded-md border border-border/60 bg-card/40 px-3 py-2.5 hover:border-primary/60 text-sm"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                Shield
              </span>
              <div>Manage policies</div>
            </Link>
            <Link
              to="/dashboard/guardian"
              className="block rounded-md border border-border/60 bg-card/40 px-3 py-2.5 hover:border-primary/60 text-sm"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                Guardian
              </span>
              <div>Review suggestions</div>
            </Link>
            <Link
              to="/dashboard/settings/keys"
              className="block rounded-md border border-border/60 bg-card/40 px-3 py-2.5 hover:border-primary/60 text-sm"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                Keys
              </span>
              <div>Manage API keys</div>
            </Link>
          </div>
        </Panel>
      </div>

      <Panel title="Live timeline" icon={Activity} tag="realtime">
        {decisions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No decisions yet. Once your shield runs, decisions appear here in realtime.
          </p>
        ) : (
          <ul className="divide-y divide-border/40 -my-2">
            {decisions.map((d) => (
              <li key={d.id} className="py-3 grid grid-cols-[auto_80px_1fr] gap-3 items-center">
                {decisionIcon(d.decision)}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {new Date(d.decided_at).toLocaleTimeString()}
                </span>
                <div className="min-w-0">
                  <span className="font-mono text-xs text-primary">{d.tool_name ?? "—"}</span>
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    · {d.message ?? d.decision}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Intelligence
            </div>
            <h3 className="font-display text-lg font-bold">Audit, intel & compliance</h3>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <IntelCard
            to="/dashboard/reports"
            icon={FileText}
            label="Reports & Audit"
            desc="Decision history, exportable for audit."
            tag="LIVE"
            tone="primary"
          />
          <IntelCard
            icon={Radar}
            label="Threat Intel"
            desc="Live feeds, IOCs and adversary playbooks."
            tag="SOON"
            tone="muted"
            soon
          />
          <IntelCard
            icon={ScrollText}
            label="Compliance"
            desc="SOC2 · ISO27001 · EU AI Act mapping."
            tag="SOON"
            tone="muted"
            soon
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function IntelCard({
  to,
  icon: Icon,
  label,
  desc,
  tag,
  tone,
  soon,
}: {
  to?: string;
  icon: typeof Zap;
  label: string;
  desc: string;
  tag: string;
  tone: "primary" | "muted";
  soon?: boolean;
}) {
  const inner = (
    <div
      className={`group relative h-full rounded-xl border bg-card/40 backdrop-blur p-4 transition ${
        soon
          ? "border-border/40 opacity-60 cursor-not-allowed"
          : "border-border/60 hover:border-primary/60 hover:bg-card/70"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="h-9 w-9 grid place-items-center rounded-md border"
          style={{
            borderColor: `color-mix(in oklab, var(--${tone === "primary" ? "primary" : "muted-foreground"}) 30%, transparent)`,
            background: `color-mix(in oklab, var(--${tone === "primary" ? "primary" : "muted-foreground"}) 8%, transparent)`,
            color: `var(--${tone === "primary" ? "primary" : "muted-foreground"})`,
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span
          className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
            soon
              ? "text-muted-foreground/70"
              : "text-success border border-success/30 bg-success/10"
          }`}
        >
          {tag}
        </span>
      </div>
      <div className="font-display text-base font-bold">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      {!soon && (
        <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition">
          open →
        </div>
      )}
    </div>
  );
  return soon || !to ? inner : <Link to={to}>{inner}</Link>;
}

function Pill({
  children,
  icon: Icon,
  tone,
}: {
  children: React.ReactNode;
  icon: typeof Zap;
  tone: "primary" | "success" | "warning";
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono"
      style={{
        borderColor: `color-mix(in oklab, var(--${tone}) 40%, transparent)`,
        background: `color-mix(in oklab, var(--${tone}) 10%, transparent)`,
        color: `var(--${tone})`,
      }}
    >
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}
