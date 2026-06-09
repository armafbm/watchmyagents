import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Activity, Plus, X, ChevronRight, Radio, ChevronDown, Copy, Check, Server } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel, Stat, SevBadge } from "@/components/dashboard/primitives";
import { TypologyBadge } from "@/components/fortress/TypologyBadge";
import { ProviderBadge, type AgentProvider } from "@/components/fortress/ProviderBadge";
import { CompositionBadge } from "@/components/fortress/CompositionBadge";
import { EnforcementBadge, type EnforcementMode } from "@/components/fortress/EnforcementBadge";
import { SessionIdList } from "@/components/fortress/SessionIdChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { generateApiKey } from "@/lib/fortress-keys";

export const Route = createFileRoute("/_authenticated/dashboard/watch")({
  head: () => ({
    meta: [{ title: "Watch · Monitoring — WatchMyAgents" }, { name: "robots", content: "noindex" }],
  }),
  component: WatchPage,
});

type Agent = {
  id: string;
  display_name: string;
  anthropic_agent_id: string | null;
  native_agent_id: string;
  provider: string | null;
  status: string;
  last_seen_at: string | null;
  shield_mode_detected: string | null;
  agent_type: string | null;
  agent_type_confidence: number | null;
  agent_type_stage: string | null;
  parent_agent_id: string | null;
  composition_pattern: string | null;
  enforcement_mode: EnforcementMode;
};

type SignalRow = {
  id: string;
  ingested_at: string;
  agent_id: string;
  window_start?: string | null;
  window_end?: string | null;
  payload: Record<string, unknown> | null;
  session_ids?: string[] | null;
};

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function severityFor(a: Agent): "OK" | "WARN" | "CRIT" | "INFO" {
  if (!a.last_seen_at) return "INFO";
  const ageMin = (Date.now() - new Date(a.last_seen_at).getTime()) / 60000;
  if (ageMin > 60) return "WARN";
  return "OK";
}

function severityOfSignal(p: Record<string, unknown> | null): "OK" | "WARN" | "CRIT" | "INFO" {
  if (!p) return "INFO";
  const sev = String((p as { severity?: unknown }).severity ?? "").toLowerCase();
  if (sev === "crit" || sev === "critical") return "CRIT";
  if (sev === "warn" || sev === "warning" || sev === "high") return "WARN";
  if (sev === "info") return "INFO";
  return "OK";
}

function kindOf(p: Record<string, unknown> | null): string {
  if (!p) return "signal";
  const k = (p as { kind?: unknown; type?: unknown }).kind ?? (p as { type?: unknown }).type;
  return typeof k === "string" ? k : "signal";
}

function summaryOf(p: Record<string, unknown> | null): string {
  if (!p) return "";
  const s =
    (p as { summary?: unknown; message?: unknown }).summary ?? (p as { message?: unknown }).message;
  if (typeof s === "string") return s;
  // derive from counts
  const counts = (p as { counts?: Record<string, number> }).counts;
  if (counts && typeof counts === "object") {
    const top = Object.entries(counts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([k, v]) => `${k}:${v}`)
      .join(" · ");
    return top || "telemetry burst";
  }
  return "";
}

// ----------------------------------------------------------------
// Register Fleet wizard
// ----------------------------------------------------------------
const RUNTIME_OPTIONS = [
  { value: "anthropic", label: "Anthropic (Claude API)" },
  { value: "openai", label: "OpenAI" },
  { value: "claude-code", label: "Claude Code (hooks)" },
  { value: "agentcore", label: "Amazon AgentCore", disabled: true },
  { value: "generic", label: "Generic / Custom" },
] as const;

function sdkSnippet(runtime: string, key: string): string {
  if (runtime === "anthropic") return `import Anthropic from "@anthropic-ai/sdk";
import { WatchMyAgents } from "watchmyagents-sdk";

const wma = new WatchMyAgents({ apiKey: "${key}" });
const client = wma.wrap(new Anthropic());

// Use client exactly like the Anthropic SDK — every call is now monitored.`;

  if (runtime === "openai") return `import OpenAI from "openai";
import { WatchMyAgents } from "watchmyagents-sdk";

const wma = new WatchMyAgents({ apiKey: "${key}" });
const client = wma.wrap(new OpenAI());

// Use client exactly like the OpenAI SDK — every call is now monitored.`;

  if (runtime === "claude-code") return `# 1. Set your WMA key in the environment
export WMA_API_KEY="${key}"

# 2. Add hooks to .claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "npx watchmyagents-hook pre" }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "npx watchmyagents-hook post" }]
    }]
  }
}`;

  return `# Generic / Custom — send signals directly via HTTP
curl -X POST https://signals.watchmyagents.com/v1/ingest \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{ "agentId": "my-agent", "kind": "tool_call", "payload": {} }'`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition">
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function RegisterFleetModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [runtime, setRuntime] = useState("anthropic");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ key: string; fleetId: string } | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Session expired."); setBusy(false); return; }
    const customer_id = u.user.id;

    // Generate WMA API key
    const { key, hash, prefix } = await generateApiKey();

    // Insert api_key
    const { data: keyRow, error: keyErr } = await (supabase as any)
      .from("api_keys")
      .insert({ label: name.trim(), prefix, hash, customer_id, runtime })
      .select("id")
      .single();
    if (keyErr) { toast.error(keyErr.message); setBusy(false); return; }

    // Insert fleet
    const { data: fleetRow, error: fleetErr } = await (supabase as any)
      .from("fleets")
      .insert({ customer_id, name: name.trim(), description: description.trim() || null, runtime, api_key_id: keyRow.id })
      .select("id")
      .single();
    if (fleetErr) { toast.error(fleetErr.message); setBusy(false); return; }

    setBusy(false);
    setResult({ key, fleetId: fleetRow.id });
    setStep(2);
  };

  const snippet = result ? sdkSnippet(runtime, result.key) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-xl bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-5 border-b border-border/40">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary mb-0.5">
              {step === 1 ? "// Register fleet" : "// Fleet registered"}
            </p>
            <h2 className="font-display text-lg font-bold">
              {step === 1 ? "New fleet" : name}
            </h2>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-md border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 ? (
            <form id="fleet-form" onSubmit={create} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Fleet name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production fleet…" maxLength={64} required autoFocus />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" maxLength={256} />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Runtime</label>
                <select
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm font-mono"
                >
                  {RUNTIME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} disabled={"disabled" in o && o.disabled}>
                      {o.label}{"disabled" in o && o.disabled ? " — coming soon" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">One WMA API key will be generated and linked to this fleet.</p>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Key reveal */}
              <div className="rounded-xl border border-success/40 bg-success/[0.06] p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-success mb-2">Fleet created — save this key now</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm break-all bg-background/60 rounded-md px-3 py-2 border border-border/40">
                    {result!.key}
                  </code>
                  <CopyButton text={result!.key} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">This key won't be shown again. Store it in your environment secrets.</p>
              </div>

              {/* SDK snippet */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {runtime === "claude-code" ? "Setup" : "SDK integration"}
                  </p>
                  <CopyButton text={snippet} />
                </div>
                <pre className="rounded-xl border border-border/40 bg-background/60 p-4 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap overflow-x-auto max-h-64">
                  {snippet}
                </pre>
              </div>

              {runtime === "anthropic" || runtime === "openai" ? (
                <div className="rounded-lg border border-border/40 bg-background/30 p-3 text-xs text-muted-foreground font-mono">
                  <span className="text-foreground font-semibold">Install: </span>
                  npm install watchmyagents-sdk
                  <CopyButton text="npm install watchmyagents-sdk" />
                </div>
              ) : null}

              <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 text-xs text-muted-foreground">
                Signals will appear in the <strong className="text-foreground">Watch</strong> page once your agent starts running.
                Use the <strong className="text-foreground">Legions</strong> page to assign this fleet's agents to teams.
              </div>
            </div>
          )}
        </div>

        <footer className="p-5 border-t border-border/40 flex justify-end gap-2">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" form="fleet-form" disabled={busy || !name.trim()}>
                {busy ? "Creating…" : <><Server className="h-3.5 w-3.5 mr-1.5" />Create fleet & generate key</>}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Done</Button>
          )}
        </footer>
      </div>
    </div>
  );
}

function WatchPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [signals, setSignals] = useState<SignalRow[]>([]);
  const [signalCountByAgent, setSignalCountByAgent] = useState<Record<string, number>>({});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFleetModal, setShowFleetModal] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: s }] = await Promise.all([
        supabase.from("agents").select("*").order("created_at", { ascending: false }),
        supabase
          .from("signals")
          .select("id,ingested_at,agent_id,window_start,window_end,payload,session_ids")
          .order("ingested_at", { ascending: false })
          .limit(50),
      ]);
      const aRows = (a as Agent[] | null) ?? [];
      const sRows = (s as SignalRow[] | null) ?? [];
      setAgents(aRows);
      setSignals(sRows);
      const counts: Record<string, number> = {};
      sRows.forEach((r) => {
        counts[r.agent_id] = (counts[r.agent_id] ?? 0) + 1;
      });
      setSignalCountByAgent(counts);
      setLoading(false);
    })();
  }, []);

  const onlineCount = agents.filter((a) => severityFor(a) === "OK").length;
  const agentName = (id: string) => agents.find((a) => a.id === id)?.display_name ?? "—";

  return (
    <DashboardLayout breadcrumb="Watch · Monitoring">
      <PageHeader
        kicker="Watch"
        layer="watch"
        title="Telemetry for every agent action."
        subtitle="Traces, tool calls and prompts captured by your shield and ingested into Fortress."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFleetModal(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-primary/40 text-primary bg-primary/10 font-mono text-xs uppercase tracking-widest hover:bg-primary/20 transition"
            >
              <Server className="h-4 w-4" /> Register fleet
            </button>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Register agent
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          label="Agents registered"
          value={loading ? "—" : String(agents.length)}
          tone="success"
          icon={Eye}
        />
        <Stat
          label="Online (last hour)"
          value={loading ? "—" : String(onlineCount)}
          icon={Activity}
          tone={onlineCount > 0 ? "success" : "warning"}
        />
        <Stat
          label="Signals (recent 50)"
          value={loading ? "—" : String(signals.length)}
          icon={Activity}
        />
        <Stat
          label="Unique sources"
          value={loading ? "—" : String(Object.keys(signalCountByAgent).length)}
        />
      </div>

      <Panel
        title="Agents under watch"
        icon={Eye}
        tag={loading ? "loading…" : `${agents.length} agent${agents.length === 1 ? "" : "s"}`}
      >
        {loading ? (
          <div className="space-y-2 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-md bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">No agent registered yet.</p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-md bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Register your first agent
            </Link>
          </div>
        ) : (
          <AgentTree
            agents={agents}
            signalCountByAgent={signalCountByAgent}
            onSelect={setSelectedAgent}
          />
        )}
      </Panel>

      <div className="mt-6">
        <Panel
          title="Signal tail"
          icon={Radio}
          tag={loading ? "loading…" : `live · last ${signals.length}`}
        >
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-md bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : signals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No signals yet. Once your shield ingests events, they show here.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {signals.map((s) => (
                <SignalCard key={s.id} signal={s} agentName={agentName(s.agent_id)} />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {selectedAgent && (
        <AgentDetailDrawer agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {showFleetModal && (
        <RegisterFleetModal onClose={() => setShowFleetModal(false)} />
      )}
    </DashboardLayout>
  );
}

function AgentTree({
  agents,
  signalCountByAgent,
  onSelect,
}: {
  agents: Agent[];
  signalCountByAgent: Record<string, number>;
  onSelect: (a: Agent) => void;
}) {
  const byParent = useMemo(() => {
    const m = new Map<string | null, Agent[]>();
    for (const a of agents) {
      const key = a.parent_agent_id ?? null;
      const arr = m.get(key) ?? [];
      arr.push(a);
      m.set(key, arr);
    }
    return m;
  }, [agents]);

  const agentById = useMemo(() => {
    const m = new Map<string, Agent>();
    agents.forEach((a) => m.set(a.id, a));
    return m;
  }, [agents]);

  // Roots = no parent OR parent missing in tenant
  const roots = useMemo(
    () => agents.filter((a) => !a.parent_agent_id || !agentById.has(a.parent_agent_id)),
    [agents, agentById],
  );

  return (
    <ul className="divide-y divide-border/40">
      {roots.map((root) => (
        <TreeNode
          key={root.id}
          agent={root}
          depth={0}
          byParent={byParent}
          agentById={agentById}
          signalCountByAgent={signalCountByAgent}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function TreeNode({
  agent,
  depth,
  byParent,
  agentById,
  signalCountByAgent,
  onSelect,
}: {
  agent: Agent;
  depth: number;
  byParent: Map<string | null, Agent[]>;
  agentById: Map<string, Agent>;
  signalCountByAgent: Record<string, number>;
  onSelect: (a: Agent) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const children = byParent.get(agent.id) ?? [];
  const parent = agent.parent_agent_id ? agentById.get(agent.parent_agent_id) : null;
  const hasChildren = children.length > 0;

  return (
    <li>
      <div
        onClick={() => onSelect(agent)}
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 cursor-pointer transition"
        style={{ paddingLeft: 12 + depth * 22 }}
      >
        <button
          type="button"
          aria-label={hasChildren ? (open ? "Collapse" : "Expand") : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setOpen((v) => !v);
          }}
          className={`h-5 w-5 grid place-items-center rounded text-muted-foreground ${
            hasChildren ? "hover:bg-secondary/60 hover:text-foreground" : "opacity-30"
          }`}
        >
          {hasChildren ? (
            open ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="h-1 w-1 rounded-full bg-current" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ProviderBadge provider={agent.provider as AgentProvider | null} />
            <span className="font-mono text-sm text-primary truncate">{agent.display_name}</span>
            <TypologyBadge a={agent} />
            <CompositionBadge pattern={agent.composition_pattern} />
            <EnforcementBadge mode={agent.enforcement_mode} />
            {hasChildren && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                · {children.length} sub-agent{children.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {parent && (
            <div className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate">
              ↳ sub-agent of <span className="text-foreground/80">{parent.display_name}</span>
            </div>
          )}
        </div>
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <SevBadge sev={severityFor(agent)} />
          <span className="font-mono text-[11px] text-muted-foreground w-20 text-right">
            {signalCountByAgent[agent.id] ?? 0} sig
          </span>
          <span className="font-mono text-[11px] text-muted-foreground w-20 text-right">
            {relativeTime(agent.last_seen_at)}
          </span>
        </div>
      </div>
      {open && hasChildren && (
        <ul className="border-l border-border/30 ml-5">
          {children.map((c) => (
            <TreeNode
              key={c.id}
              agent={c}
              depth={depth + 1}
              byParent={byParent}
              agentById={agentById}
              signalCountByAgent={signalCountByAgent}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function SignalCard({ signal, agentName }: { signal: SignalRow; agentName: string }) {
  const [open, setOpen] = useState(false);
  const sev = severityOfSignal(signal.payload);
  const kind = kindOf(signal.payload);
  const summary = summaryOf(signal.payload);
  const toneVar =
    sev === "CRIT"
      ? "danger"
      : sev === "WARN"
        ? "warning"
        : sev === "INFO"
          ? "muted-foreground"
          : "success";

  return (
    <li className="rounded-lg border border-border/40 bg-background/30 hover:border-primary/40 transition overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-stretch gap-3 text-left"
      >
        <span aria-hidden className="w-1 shrink-0" style={{ background: `var(--${toneVar})` }} />
        <div className="flex-1 grid grid-cols-[80px_110px_1fr_auto] items-center gap-3 px-3 py-2.5 min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground">
            {new Date(signal.ingested_at).toLocaleTimeString()}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded justify-self-start"
            style={{
              background: `color-mix(in oklab, var(--${toneVar}) 15%, transparent)`,
              color: `var(--${toneVar})`,
            }}
          >
            {kind}
          </span>
          <span className="text-sm text-muted-foreground truncate font-mono">
            <span className="text-foreground/80">{agentName}</span>
            {summary && <span className="text-muted-foreground"> · {summary}</span>}
          </span>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40 bg-background/40 space-y-3">
          {signal.session_ids && signal.session_ids.length > 0 && (
            <SessionIdList sessionIds={signal.session_ids} signalId={signal.id} />
          )}
          <pre className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
            {JSON.stringify(signal.payload, null, 2)}
          </pre>
        </div>
      )}
    </li>
  );
}

function AgentDetailDrawer({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [logs, setLogs] = useState<SignalRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("signals")
        .select("id,ingested_at,agent_id,window_start,window_end,payload,session_ids")
        .eq("agent_id", agent.id)
        .order("ingested_at", { ascending: false })
        .limit(200);
      if (!cancelled) setLogs((data as SignalRow[] | null) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [agent.id]);

  const stats = useMemo(() => {
    if (!logs) return null;
    const sevCounts: Record<"OK" | "WARN" | "CRIT" | "INFO", number> = {
      OK: 0,
      WARN: 0,
      CRIT: 0,
      INFO: 0,
    };
    logs.forEach((l) => sevCounts[severityOfSignal(l.payload)]++);
    return {
      total: logs.length,
      OK: sevCounts.OK,
      WARN: sevCounts.WARN,
      CRIT: sevCounts.CRIT,
      INFO: sevCounts.INFO,
    };
  }, [logs]);

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-background/70 backdrop-blur-sm"
      />
      <aside className="w-full max-w-2xl h-full bg-card/95 backdrop-blur-xl border-l border-border/60 flex flex-col shadow-2xl">
        <header className="flex items-start justify-between gap-4 p-5 border-b border-border/40">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary mb-1">
              // Agent detail
            </p>
            <div className="flex items-center gap-2 mb-1">
              <ProviderBadge provider={agent.provider as AgentProvider | null} />
              <h2 className="font-display text-xl font-bold truncate">{agent.display_name}</h2>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground truncate mt-1">
              {agent.native_agent_id ?? agent.anthropic_agent_id ?? "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TypologyBadge a={agent} />
              <EnforcementBadge mode={agent.enforcement_mode} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-md border border-border/60 hover:border-primary/60 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-4 gap-2 p-5 border-b border-border/40">
          <MiniStat label="Logs" value={stats ? String(stats.total) : "…"} tone="primary" />
          <MiniStat label="OK" value={stats ? String(stats.OK) : "…"} tone="success" />
          <MiniStat label="Warn" value={stats ? String(stats.WARN) : "…"} tone="warning" />
          <MiniStat label="Crit" value={stats ? String(stats.CRIT) : "…"} tone="danger" />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold">Recent logs</h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              last {logs?.length ?? 0}
            </span>
          </div>
          {!logs ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs for this agent yet.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((s) => (
                <SignalCard key={s.id} signal={s} agentName={agent.display_name} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`font-display text-xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
