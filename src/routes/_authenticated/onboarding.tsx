import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateApiKey } from "@/lib/fortress-keys";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{ title: "Onboarding — Fortress" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

type Provider = "anthropic-managed" | "openai-agents";

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [provider, setProvider] = useState<Provider>("anthropic-managed");
  const [agentId, setAgentId] = useState("");
  const [agentRow, setAgentRow] = useState<{
    native_agent_id: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, k: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(k);
    setTimeout(() => setCopied(null), 1500);
  };

  const submitStep1 = async () => {
    if (!agentId.trim()) return;
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }
    const customer_id = u.user.id;
    const native = agentId.trim();
    const { data, error } = await supabase
      .from("agents")
      .insert({
        provider,
        native_agent_id: native,
        anthropic_agent_id: provider === "anthropic-managed" ? native : null,
        display_name: native,
        customer_id,
      })
      .select()
      .single();
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAgentRow(data);
    setStep(2);
  };

  const generateKey = async () => {
    setLoading(true);
    const { key, hash, prefix } = await generateApiKey();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }
    const customer_id = u.user.id;
    const { error } = await supabase
      .from("api_keys")
      .insert({ label: "Default", prefix, hash, customer_id });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setApiKey(key);
  };

  const nativeId = agentRow?.native_agent_id ?? "<agent-id>";
  const wmaKey = apiKey ?? "<key-from-step-2>";

  const installCmd = `npm install -g watchmyagents
export ANTHROPIC_API_KEY="sk-ant-..."
export WMA_API_KEY="${wmaKey}"
wma-shield --agent-id ${nativeId}`;

  const openaiSnippet = `import { openaiAgents } from "watchmyagents";

// Add to your agent config
openaiAgents({
  apiKey: process.env.WMA_API_KEY, // "${wmaKey}"
  agentId: "${nativeId}",
  policiesPath: "./policies.json", // local fallback — Fortress sync in v1.4.6
});`;

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-full grid place-items-center font-mono text-xs border ${
                  step >= s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`h-px w-12 ${step > s ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
                  Step 1 / 3
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Register your first agent</h1>
                <p className="text-sm text-muted-foreground">
                  Choose your framework, then enter your agent ID.
                </p>
              </div>

              {/* Framework picker */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setProvider("anthropic-managed"); setAgentId(""); }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    provider === "anthropic-managed"
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-background/40 hover:border-border"
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">Console Anthropic</div>
                  <div className="text-[11px] text-muted-foreground">
                    Agent créé via api.anthropic.com/agents
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setProvider("openai-agents"); setAgentId(""); }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    provider === "openai-agents"
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-background/40 hover:border-border"
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">OpenAI Agents SDK</div>
                  <div className="text-[11px] text-muted-foreground">
                    Agent construit avec le SDK openai-agents
                  </div>
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentId">
                  {provider === "anthropic-managed" ? "Anthropic Agent ID" : "Agent name / ID"}
                </Label>
                <Input
                  id="agentId"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder={
                    provider === "anthropic-managed" ? "agent_01XaN..." : "my-openai-agent"
                  }
                  autoFocus
                />
              </div>

              <Button
                onClick={submitStep1}
                disabled={!agentId.trim() || loading}
                className="w-full"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Register agent <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
                  Step 2 / 3
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Generate your API key</h1>
                <p className="text-sm text-muted-foreground">
                  Fortress will use this key to authenticate the shield running next to your agent.
                </p>
              </div>

              {!apiKey ? (
                <Button onClick={generateKey} disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Generate API key
                </Button>
              ) : (
                <>
                  <div className="rounded-lg border border-warning/40 bg-warning/[0.06] p-4 flex gap-3">
                    <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-warning mb-1">Save this key now.</div>
                      <div className="text-muted-foreground">
                        It is shown only once. We only store its SHA-256 hash.
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-3 flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm break-all">{apiKey}</code>
                    <Button size="sm" variant="outline" onClick={() => copy(apiKey, "key")}>
                      {copied === "key" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <Button onClick={() => setStep(3)} className="w-full">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
                  Step 3 / 3
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">
                  {provider === "anthropic-managed" ? "Install the shield" : "Add Fortress to your agent"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {provider === "anthropic-managed"
                    ? "Run this on the host where your Anthropic agent executes."
                    : "Add this snippet to your OpenAI agent configuration."}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/60 p-4 relative">
                <pre className="font-mono text-xs whitespace-pre-wrap break-all text-foreground/90">
                  {provider === "anthropic-managed" ? installCmd : openaiSnippet}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    copy(
                      provider === "anthropic-managed" ? installCmd : openaiSnippet,
                      "cmd",
                    )
                  }
                >
                  {copied === "cmd" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <Button onClick={() => navigate({ to: "/dashboard" })} className="w-full">
                I've installed it — go to dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
