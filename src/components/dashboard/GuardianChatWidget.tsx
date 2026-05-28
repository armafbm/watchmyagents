import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayerIcon } from "@/components/site/LayerIcons";
import mascot from "@/assets/wma-mascot.png";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "guardian-chat:v1";
const SUGGESTIONS = [
  "Summarize my current risk posture",
  "Top 3 pending suggestions?",
  "Most suspicious agent right now?",
  "Explain my Shield policies",
];

export function GuardianChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw) as Msg[]);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch { /* noop */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

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
      const reply = data as { reply?: string; error?: string } | null;
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
    <>
      {/* Popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(92vw,400px)] h-[min(75vh,600px)] flex flex-col rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <LayerIcon layer="guardian" className="h-5 w-5 shrink-0" />
              <div className="leading-tight min-w-0">
                <div className="font-display text-sm font-bold truncate">Guardian AI</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">gemini-2.5-flash</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clear}
                  disabled={sending}
                  aria-label="Clear conversation"
                  className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full grid place-items-center text-center">
                <div>
                  <img src={mascot} alt="" className="h-16 w-16 mx-auto mb-2 object-contain animate-float" />
                  <div className="font-display text-base font-bold mb-1">Hi, I'm Guardian.</div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ask me about risks, suggestions and Shield policies.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 text-left">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs rounded-lg border border-border/60 bg-background/40 hover:bg-secondary/40 hover:border-primary/40 transition px-3 py-1.5"
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
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[95%] prose prose-sm prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1 prose-code:text-primary text-foreground text-sm">
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

          {/* Composer */}
          <div className="border-t border-border/60 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                rows={2}
                placeholder="Ask Guardian…"
                className="flex-1 resize-none rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                disabled={sending}
              />
              <Button size="icon" onClick={() => send(input)} disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1.5 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70">
              Anonymized telemetry · stored locally
            </p>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Guardian chat" : "Open Guardian chat"}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 h-12 pl-3 pr-4 rounded-full border border-primary/40 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all"
      >
        <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl -z-10 animate-pulse-ring" />
        <LayerIcon layer="guardian" className="h-5 w-5" />
        <span className="hidden sm:inline font-display text-sm font-semibold tracking-wide">
          Ask Guardian
        </span>
      </button>
    </>
  );
}
