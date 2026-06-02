import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, X, Shield, Moon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRole } from "@/hooks/useRole";
import { SignatureChip } from "@/components/policies/SignatureChip";
import { autoSignOwnPolicy, getPolicySignature, signPolicy } from "@/lib/fortress-signing.functions";

export type PolicySurface = "agent" | "subtree" | "type" | "fleet";

export type PolicyMode = "enforce" | "shadow";

export type PolicyDraft = {
  id?: string;
  rule_id?: string;
  name?: string;
  rationale?: string;
  action?: string;
  message?: string;
  match?: string; // JSON string
  surface_type?: PolicySurface;
  surface_ref?: string | null;
  agent_id?: string | null;
  mode?: PolicyMode;
};

const AGENT_TYPES = [
  "coding","devops_infra","data_rag","customer_facing","browser_web",
  "orchestrator","workflow_backoffice","personal_assistant",
  "transactional_financial","generic",
] as const;



const ACTIONS = ["allow", "deny", "interrupt"] as const;

export function PolicyEditor({
  draft,
  onClose,
  onSaved,
}: {
  draft: PolicyDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(draft.name ?? "");
  const [ruleId, setRuleId] = useState(draft.rule_id ?? `rule-${Date.now().toString(36)}`);
  const [rationale, setRationale] = useState(draft.rationale ?? "");
  const [action, setAction] = useState<string>(draft.action ?? "deny");
  const [message, setMessage] = useState(draft.message ?? "");
  const [matchStr, setMatchStr] = useState(draft.match ?? `{\n  "tool_name": "*"\n}`);
  const [surfaceType, setSurfaceType] = useState<PolicySurface>(
    draft.surface_type ?? (draft.agent_id ? "agent" : "fleet"),
  );
  const [surfaceRef, setSurfaceRef] = useState<string>(draft.surface_ref ?? "generic");
  const [agentId, setAgentId] = useState<string | null>(
    draft.agent_id ?? (draft.surface_type === "subtree" ? draft.surface_ref ?? null : null),
  );
  const [agentOpts, setAgentOpts] = useState<Array<{ id: string; display_name: string; agent_type: string | null; enforcement_mode: string | null }>>([]);
  const [mode, setMode] = useState<PolicyMode>(draft.mode ?? "enforce");
  const [isFirstPolicy, setIsFirstPolicy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("agents")
      .select("id, display_name, agent_type, enforcement_mode")
      .order("display_name")
      .then(({ data }) => {
        setAgentOpts(((data as Array<{ id: string; display_name: string; agent_type: string | null; enforcement_mode: string | null }> | null) ?? []));
      });
    // Onboarding nudge: if this is a brand-new policy and the customer has no policies yet, default to shadow.
    if (!draft.id && draft.mode === undefined) {
      supabase
        .from("policies")
        .select("id", { count: "exact", head: true })
        .then(({ count }) => {
          if ((count ?? 0) === 0) {
            setMode("shadow");
            setIsFirstPolicy(true);
          }
        });
    }
  }, [draft.id, draft.mode]);

  const selectedAgent = agentId ? agentOpts.find((a) => a.id === agentId) : null;
  const selectedEnforcement = selectedAgent?.enforcement_mode ?? "sync_confirm";
  const isDetectOnlyAgent =
    (surfaceType === "agent" || surfaceType === "subtree") && selectedEnforcement === "detect_only";
  const availableActions: readonly string[] =
    (surfaceType === "agent" || surfaceType === "subtree") && selectedEnforcement === "sync_interrupt"
      ? (["allow", "interrupt"] as const)
      : ACTIONS;

  // If the current action is no longer available, snap to a safe default
  useEffect(() => {
    if (!availableActions.includes(action)) {
      setAction(availableActions[0] ?? "allow");
    }
  }, [availableActions, action]);

  const save = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(matchStr);
    } catch {
      toast.error("Match must be valid JSON");
      return;
    }
    if (!name.trim() || !ruleId.trim()) {
      toast.error("Name and rule_id are required");
      return;
    }
    if ((surfaceType === "agent" || surfaceType === "subtree") && !agentId) {
      toast.error(`Pick an agent for surface '${surfaceType}'`);
      return;
    }
    if (surfaceType === "type" && !surfaceRef) {
      toast.error("Pick a typology for surface 'type'");
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const customer_id = u.user!.id;
    const payload = {
      ...(draft.id ? { id: draft.id } : {}),
      rule_id: ruleId.trim(),
      name: name.trim(),
      rationale: rationale.trim() || null,
      action,
      mode,
      message: message.trim() || null,
      match: parsed as never,
      surface_type: surfaceType,
      surface_ref:
        surfaceType === "type" ? surfaceRef :
        surfaceType === "subtree" ? agentId :
        null,
      agent_id: surfaceType === "agent" ? agentId : null,
      customer_id,
    };
    const { error } = await supabase.from("policies").upsert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(draft.id ? "Policy updated" : "Policy created (pending — enable to deploy)");
    onSaved();
  };


  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="font-display text-lg font-bold">
            {draft.id ? "Edit policy" : "New policy"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rule_id">Rule ID</Label>
              <Input id="rule_id" value={ruleId} onChange={(e) => setRuleId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Deploy surface</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["agent", "subtree", "type", "fleet"] as const).map((s) => (
                <label key={s}>
                  <input
                    type="radio"
                    name="surface"
                    value={s}
                    checked={surfaceType === s}
                    onChange={() => setSurfaceType(s)}
                    className="sr-only peer"
                  />
                  <div className="cursor-pointer text-center py-2 rounded-md border border-border peer-checked:border-primary peer-checked:bg-primary/10 text-[11px] font-mono uppercase tracking-widest">
                    {s === "agent" ? "This agent"
                      : s === "subtree" ? "Subtree"
                      : s === "type" ? "Same type"
                      : "Whole fleet"}
                  </div>
                </label>
              ))}
            </div>
            {surfaceType === "subtree" && (
              <p className="text-[11px] text-muted-foreground">
                Applies to the chosen agent AND every descendant in its sub-agent tree.
              </p>
            )}
            {(surfaceType === "agent" || surfaceType === "subtree") && (
              <Select value={agentId ?? ""} onValueChange={(v) => setAgentId(v || null)}>
                <SelectTrigger><SelectValue placeholder="Pick an agent…" /></SelectTrigger>
                <SelectContent>
                  {agentOpts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.display_name}{a.agent_type ? ` · ${a.agent_type}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {surfaceType === "type" && (
              <Select value={surfaceRef} onValueChange={setSurfaceRef}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Created as <b>pending</b> — toggle Enabled in the table to deploy. The
              global-baseline floors always apply on top.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rationale">Rationale</Label>
            <Textarea id="rationale" rows={2} value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </div>
          {isDetectOnlyAgent && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              Detection-only agent — Shield enforcement is not available for this adapter. WMA will surface findings
              in Reports &amp; Audit but cannot block actions in real time. This rule will be saved in monitor mode.
            </div>
          )}
          <div className={`space-y-1.5 ${isDetectOnlyAgent ? "opacity-50 pointer-events-none" : ""}`}>
            <Label>Action</Label>
            <div className="flex gap-2">
              {availableActions.map((a) => (
                <label key={a} className="flex-1">
                  <input
                    type="radio"
                    name="action"
                    value={a}
                    checked={action === a}
                    onChange={() => setAction(a)}
                    className="sr-only peer"
                  />
                  <div className="cursor-pointer text-center py-2 rounded-md border border-border peer-checked:border-primary peer-checked:bg-primary/10 text-sm font-mono uppercase tracking-widest">
                    {a === "interrupt" && selectedEnforcement === "sync_interrupt" ? "interrupt" : a}
                  </div>
                </label>
              ))}
            </div>
            {selectedEnforcement === "sync_interrupt" && (surfaceType === "agent" || surfaceType === "subtree") && (
              <p className="text-[11px] text-muted-foreground">
                Adapter is <code className="font-mono">sync_interrupt</code>: fine-grained confirm is not available —
                only allow or interrupt.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <div className="flex gap-2">
              {(["enforce", "shadow"] as const).map((m) => {
                const active = mode === m;
                const Icon = m === "enforce" ? Shield : Moon;
                const tone =
                  m === "enforce"
                    ? active
                      ? "border-success/60 bg-success/10 text-success"
                      : "border-border text-muted-foreground hover:text-foreground"
                    : active
                      ? "border-warning/60 bg-warning/10 text-warning"
                      : "border-border text-muted-foreground hover:text-foreground";
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    title={
                      m === "shadow"
                        ? "Evaluates the rule and logs the decision, but does NOT block the agent. Use this to calibrate a new rule before promoting to Enforce."
                        : "The rule blocks or interrupts the agent when matched."
                    }
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-md border text-sm font-mono uppercase tracking-widest transition ${tone}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {m === "shadow" ? "🌓 shadow" : "enforce"}
                  </button>
                );
              })}
            </div>
            {mode === "shadow" && (
              <div className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-[11px] text-warning/90">
                Shadow is a staging step. The SDK evaluates the rule and logs the decision, but the agent is not
                blocked. Promote to Enforce once you trust the signal.
              </div>
            )}
            {isFirstPolicy && mode === "shadow" && (
              <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-[11px] text-primary">
                Your first rule starts in Shadow so you can see what it would do without risking false positives.
                Promote when ready.
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message (shown to agent on enforcement)</Label>
            <Input id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match">Match (JSON)</Label>
            <Textarea
              id="match"
              rows={8}
              value={matchStr}
              onChange={(e) => setMatchStr(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/60 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {draft.id ? "Save changes" : "Create policy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
