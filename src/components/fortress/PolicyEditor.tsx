import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type PolicyDraft = {
  id?: string;
  rule_id?: string;
  name?: string;
  rationale?: string;
  action?: string;
  message?: string;
  match?: string; // JSON string
  surface_type?: "agent" | "type" | "fleet";
  surface_ref?: string | null;
  agent_id?: string | null;
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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const customer_id = u.user!.id;
    const payload = {
      ...(draft.id ? { id: draft.id } : {}),
      rule_id: ruleId.trim(),
      name: name.trim(),
      rationale: rationale.trim() || null,
      action,
      message: message.trim() || null,
      match: parsed as never,
      customer_id,
    };
    const { error } = await supabase.from("policies").upsert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(draft.id ? "Policy updated" : "Policy created");
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
            <Label htmlFor="rationale">Rationale</Label>
            <Textarea id="rationale" rows={2} value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Action</Label>
            <div className="flex gap-2">
              {ACTIONS.map((a) => (
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
                    {a}
                  </div>
                </label>
              ))}
            </div>
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
