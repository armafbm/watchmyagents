import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import mascot from "@/assets/wma-mascot.png";

export const Route = createFileRoute("/_authenticated/dashboard/guardian-chat")({
  head: () => ({ meta: [{ title: "Guardian Chat — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: GuardianChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "guardian-chat:v1";
const SUGGESTIONS = [
  "Summarize my current risk posture",
  "What are the top 3 pending suggestions?",
  "Which agent looks most suspicious right now?",
  "Explain my deployed Shield policies",
];

function GuardianChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore from localStorage (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw) as Msg[]);
    } catch { /* noop */ }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* noop */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("guardian-chat", {
        body: { messages: next },
      });
      if (error) throw new Error(error.message);
      const reply = (data as { reply?: string; error?: string } | null);
      if (reply?.error) throw new Error(reply.error);
      setMessages([...next, { role: "assistant", content: reply?.reply ?? "(no answer)" }]);
    } catch (e) {
      toast.error((e as Error).message);
      setMessages([...next, { role: "assistant", content: `_Error: ${(e as Error).message}_` }]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clear = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  };

  return (
    <DashboardLayout breadcrumb="Guardian Chat">
      <PageHeader
        kicker="Guardian"
        layer="guardian"
        title="Chat with Guardian AI"
        subtitle="Ask Guardian about your fleet's risk posture, suggestions and policies. Powered by Gemini, scoped to your tenant."
        actions={
          messages.length > 0 ? (
            <Button variant="ghost" onClick={clear} disabled={sending}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
          ) : null
        }
      />

      <Panel title="Conversation" icon={Sparkles} tag="gemini-2.5-flash">
        <div
          ref={scrollRef}
          className="h-[55vh] overflow-y-auto pr-1 space-y-4 mb-3"
        >
          {messages.length === 0 ? (
            <div className="h-full grid place-items-center text-center">
              <div className="max-w-md">
                <img src={mascot} alt="" className="h-20 w-20 mx-auto mb-3 object-contain animate-float" />
                <div className="font-display text-lg font-bold mb-1">Hi, I'm Guardian.</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask me about risks, suggestions and the Shield policies deployed on your fleet.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/40 hover:border-primary/40 transition px-3 py-2"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[90%] prose prose-sm prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1 prose-code:text-primary text-foreground">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardian is thinking…
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 border-t border-border/40 pt-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={2}
            placeholder="Ask Guardian anything about your fleet…"
            className="flex-1 resize-none rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={sending}
          />
          <Button onClick={() => send(input)} disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
          Guardian only sees anonymized telemetry · conversation stored locally in this browser
        </p>
      </Panel>
    </DashboardLayout>
  );
}
