import { createFileRoute } from "@tanstack/react-router";
import { Brain, Check, X, Loader2, Sparkles, Shield, AlertTriangle, Target, RefreshCw, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import mascot from "@/assets/wma-mascot.png";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuardianChatPanel } from "@/components/dashboard/GuardianChatPanel";
import { TypologyBadge, type AgentTypology } from "@/components/fortress/TypologyBadge";
import { ProviderBadge, type AgentProvider } from "@/components/fortress/ProviderBadge";
import { EnforcementBadge, isDetectOnly, type EnforcementMode } from "@/components/fortress/EnforcementBadge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/guardian")({
  head: () => ({ meta: [{ title: "Guardian AI — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: GuardianPage,
});

type ProposedPolicy = {
  rule_id: string;
  name: string;
  match: Record<string, unknown>;
  action: string;
  message: string;
  priority?: number;
  enforceable_now?: boolean;
  enforcement_note?: string | null;
};

type Suggestion = {
  id: string;
  customer_id: string;
  agent_id: string;
  generated_at: string;
  title: string;
  rationale: string;
  proposed_action: string;
  proposed_match: Record<string, unknown>;
  proposed_message: string | null;
  risk_score: number | null;
  risk_category: string | null;
  confidence: number | null;
  objective: string | null;
  surface_type: string | null;
  surface_ref: string | null;
  generated_by: string | null;
  proposed_policy: ProposedPolicy | null;
};

function severityTone(score: number | null) {
  const s = score ?? 0;
  if (s >= 70) return { bg: "bg-danger/15", text: "text-danger", border: "border-danger/40", label: "CRITICAL" };
  if (s >= 40) return { bg: "bg-warning/15", text: "text-warning", border: "border-warning/40", label: "ELEVATED" };
  return { bg: "bg-success/15", text: "text-success", border: "border-success/40", label: "LOW" };
}

function actionTone(a: string) {
  if (a === "deny" || a === "block") return "bg-danger/15 text-danger border-danger/40";
  if (a === "interrupt") return "bg-warning/15 text-warning border-warning/40";
  return "bg-success/15 text-success border-success/40";
}

type AgentMini = AgentTypology & {
  id: string;
  display_name: string;
  anthropic_agent_id: string | null;
  native_agent_id: string;
  provider: string | null;
  enforcement_mode: EnforcementMode;
};

function GuardianPage() {
  const [list, setList] = useState<Suggestion[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentMini>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [surfaceOverride, setSurfaceOverride] = useState<Record<string, string>>({});

  const reload = async () => {
    setLoading(true);
    const [{ data }, { data: ag }] = await Promise.all([
      supabase
        .from("suggestions")
        .select("*")
        .eq("status", "pending")
        .order("risk_score", { ascending: false, nullsFirst: false })
        .order("generated_at", { ascending: false }),
      supabase
        .from("agents")
        .select("id, display_name, anthropic_agent_id, native_agent_id, provider, agent_type, agent_type_stage, agent_type_confidence, enforcement_mode"),
    ]);
    setList((data as unknown as Suggestion[] | null) ?? []);
    const map: Record<string, AgentMini> = {};
    ((ag as AgentMini[] | null) ?? []).forEach((a) => { map[a.id] = a; });
    setAgents(map);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    const ch = supabase
      .channel("guardian-suggestions")
      .on("postgres_changes", { event: "*", schema: "public", table: "suggestions" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const stats = useMemo(() => {
    const count = list.length;
    const avg = count ? Math.round(list.reduce((a, s) => a + (s.risk_score ?? 0), 0) / count) : 0;
    const byCategory: Record<string, number> = {};
    for (const s of list) {
      const k = s.risk_category ?? "other";
      byCategory[k] = (byCategory[k] ?? 0) + 1;
    }
    return { count, avg, byCategory };
  }, [list]);

  const runGuardianNow = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("guardian", { body: {} });
    setRunning(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const emitted = (data as { suggestions_emitted?: number } | null)?.suggestions_emitted ?? 0;
    toast.success(`Guardian scan complete — ${emitted} new suggestion${emitted === 1 ? "" : "s"}`);
    reload();
  };

  const accept = async (s: Suggestion) => {
    setBusy(s.id);
    const pp = s.proposed_policy;
    if (!pp) {
      setBusy(null);
      toast.error("Suggestion is missing a deployable policy");
      return;
    }
    const surface = (surfaceOverride[s.id] ?? s.surface_type ?? "agent") as "agent" | "type" | "fleet";

    // Resolve surface_ref for 'type' (need the agent's agent_type)
    let surfaceRef: string | null = null;
    if (surface === "type") {
      const { data: ag } = await supabase
        .from("agents").select("agent_type").eq("id", s.agent_id).maybeSingle();
      surfaceRef = (ag as { agent_type: string | null } | null)?.agent_type ?? s.surface_ref ?? null;
      if (!surfaceRef) {
        setBusy(null);
        toast.error("This agent has no detected typology yet — pick agent or fleet.");
        return;
      }
    }

    const agentId = surface === "agent" ? s.agent_id : null;

    // Collision-safe rule_id
    let ruleId = pp.rule_id;
    const { data: existing } = await supabase
      .from("policies")
      .select("id")
      .eq("customer_id", s.customer_id)
      .eq("rule_id", ruleId)
      .maybeSingle();
    if (existing) ruleId = `${ruleId}-${s.agent_id.slice(0, 6)}`;

    const { data: pol, error } = await supabase
      .from("policies")
      .insert({
        customer_id: s.customer_id,
        agent_id: agentId,
        surface_type: surface,
        surface_ref: surfaceRef,
        rule_id: ruleId,
        name: pp.name,
        rationale: s.rationale,
        match: pp.match as never,
        action: pp.action,
        message: pp.message,
        priority: pp.priority ?? 100,
        suggested_by_guardian: true,
        suggestion_id: s.id,
        // User click IS the human gate — deploy immediately.
        enabled: true,
      })
      .select()
      .single();
    if (error || !pol) {
      setBusy(null);
      toast.error(error?.message ?? "Failed to deploy policy");
      return;
    }
    const { error: e2 } = await supabase
      .from("suggestions")
      .update({
        status: "accepted",
        applied_policy_id: pol.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", s.id);
    setBusy(null);
    if (e2) {
      toast.error(e2.message);
      return;
    }
    toast.success(`Policy deployed on ${surface}${surfaceRef ? `: ${surfaceRef}` : ""}.`);
    reload();
  };


  const reject = async (s: Suggestion) => {
    setBusy(s.id);
    const { error } = await supabase
      .from("suggestions")
      .update({ status: "rejected", resolved_at: new Date().toISOString() })
      .eq("id", s.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else reload();
  };

  return (
    <DashboardLayout breadcrumb="Guardian AI">
      <PageHeader
        kicker="Guardian"
        layer="guardian"
        title="LLM-scored risks. Human-approved policies."
        subtitle="Guardian reads only anonymized telemetry, identifies security risks, scores them, and proposes deployable Shield policies for your review."
        actions={
          <Button onClick={runGuardianNow} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Run scan now
          </Button>
        }
      />

      <Tabs defaultValue="risks" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="risks">
            <Brain className="h-4 w-4 mr-2" /> Risks & policies
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" /> Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Stat label="Pending risks" value={loading ? "—" : String(stats.count)} icon={AlertTriangle} tone="warning" />
            <Stat
              label="Average risk score"
              value={loading ? "—" : `${stats.avg}/100`}
              icon={Target}
              tone={stats.avg >= 70 ? "danger" : stats.avg >= 40 ? "warning" : "success"}
            />
            <Stat
              label="Categories"
              value={loading ? "—" : String(Object.keys(stats.byCategory).length)}
              icon={Shield}
              tone="primary"
              delta={
                loading
                  ? undefined
                  : Object.entries(stats.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([k, v]) => `${k}:${v}`)
                      .join("  ") || undefined
              }
            />
          </div>


          <div className="grid lg:grid-cols-[1fr_320px] gap-4">
            <Panel title="Validation queue" icon={Brain} tag={`${list.length} pending`}>
              {loading ? (
                <div className="py-10 flex justify-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : list.length === 0 ? (
                <div className="py-12 text-center">
                  <Brain className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <div className="font-display text-lg font-bold mb-1">Inbox empty</div>
                  <p className="text-sm text-muted-foreground">
                    Guardian scans every 15 minutes. Run a manual scan to populate suggestions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {list.map((s) => {
                    const sev = severityTone(s.risk_score);
                    const pp = s.proposed_policy;
                    const surface = surfaceOverride[s.id] ?? s.surface_type ?? "agent";
                    const enforceable = pp?.enforceable_now === true;
                    const agent = agents[s.agent_id];
                    return (
                      <div
                        key={s.id}
                        className={`rounded-xl border ${sev.border} bg-background/40 p-4`}
                      >
                        <div className="flex flex-wrap items-center gap-2 pb-3 mb-3 border-b border-border/40">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            // source agent
                          </span>
                          <ProviderBadge provider={agent?.provider as AgentProvider | null | undefined} />
                          <span className="font-semibold text-sm text-foreground">
                            {agent?.display_name ?? "Unknown agent"}
                          </span>
                          <code className="font-mono text-[10px] text-muted-foreground">
                            {(() => {
                              const id = agent?.native_agent_id ?? agent?.anthropic_agent_id;
                              return id ? `${id.slice(0, 14)}…` : `${s.agent_id.slice(0, 8)}…`;
                            })()}
                          </code>
                          {agent && <TypologyBadge a={agent} />}
                        </div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex flex-col items-center justify-center rounded-lg border ${sev.border} ${sev.bg} ${sev.text} px-3 py-2 min-w-[70px]`}
                            >
                              <span className="font-display text-2xl font-bold leading-none">{s.risk_score ?? 0}</span>
                              <span className="font-mono text-[9px] uppercase tracking-widest mt-1">{sev.label}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold leading-snug">{s.title}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                  {s.risk_category ?? "other"}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  · confidence {s.confidence ?? 0}%
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  · {new Date(s.generated_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded border text-xs font-mono uppercase tracking-widest ${actionTone(s.proposed_action)}`}
                          >
                            {s.proposed_action}
                          </span>
                        </div>

                        {s.objective && (
                          <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                            <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
                              // Objective
                            </div>
                            <p className="text-sm">{s.objective}</p>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">
                          {s.rationale}
                        </p>

                        {pp && (
                          <div className="rounded-lg border border-border/60 bg-background/60 p-3 mb-4 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                rule_id
                              </span>
                              <code className="font-mono text-xs text-foreground">{pp.rule_id}</code>
                              <span
                                className={`ml-auto px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-widest ${
                                  enforceable
                                    ? "bg-success/15 text-success border-success/40"
                                    : "bg-muted text-muted-foreground border-border"
                                }`}
                                title={pp.enforcement_note ?? undefined}
                              >
                                {enforceable ? "enforceable now" : "needs Shield capability"}
                              </span>
                            </div>
                            <pre className="text-xs font-mono bg-background/80 border border-border/40 rounded-md p-2 overflow-x-auto">
                              {JSON.stringify(pp.match, null, 2)}
                            </pre>
                            {pp.message && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-mono uppercase tracking-widest text-[10px] mr-2">deny msg</span>
                                {pp.message}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              deploy on
                            </span>
                            <Select
                              value={surface}
                              onValueChange={(v) => setSurfaceOverride((m) => ({ ...m, [s.id]: v }))}
                            >
                              <SelectTrigger className="h-8 w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="agent">This agent</SelectItem>
                                <SelectItem value="type">Same type</SelectItem>
                                <SelectItem value="fleet">Entire fleet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="ml-auto flex gap-2">
                            <Button onClick={() => accept(s)} disabled={busy === s.id || !pp}>
                              <Check className="h-4 w-4 mr-2" /> Accept & deploy
                            </Button>
                            <Button variant="ghost" onClick={() => reject(s)} disabled={busy === s.id}>
                              <X className="h-4 w-4 mr-2" /> Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>

            <div className="space-y-4">
              <Panel title="Sentinel" icon={Sparkles}>
                <div className="relative h-40 grid place-items-center">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse-ring" />
                  <img src={mascot} alt="" className="relative h-36 w-36 object-contain animate-float" />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Guardian online · LLM scan every 15min
                </p>
              </Panel>
              <Panel title="Pipeline">
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
                  <li><span className="text-foreground font-medium">Analyze</span> — aggregate anonymized signals.</li>
                  <li><span className="text-foreground font-medium">Report</span> — LLM identifies & scores risks.</li>
                  <li><span className="text-foreground font-medium">Suggest</span> — propose a deployable policy.</li>
                  <li><span className="text-foreground font-medium">Approve</span> — you accept, modify, or reject.</li>
                  <li><span className="text-foreground font-medium">Deploy</span> — Shield enforces in real time.</li>
                </ol>
              </Panel>
              <Panel title="Privacy">
                <p className="text-xs text-muted-foreground">
                  Guardian only ever sees anonymized counts, distributions and salted hashes.
                  Raw URLs, prompts and commands never leave your environment.
                </p>
              </Panel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-0">
          <Panel title="Conversation" icon={MessageCircle} tag="gemini-2.5-flash">
            <GuardianChatPanel />
          </Panel>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
