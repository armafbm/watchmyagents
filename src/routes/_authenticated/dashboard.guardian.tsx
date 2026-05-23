import { createFileRoute } from "@tanstack/react-router";
import { Brain, Sparkles, Send } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import mascot from "@/assets/wma-mascot.png";

export const Route = createFileRoute("/_authenticated/dashboard/guardian")({
  head: () => ({ meta: [{ title: "Guardian AI — WatchMyAgents" }, { name: "robots", content: "noindex" }] }),
  component: GuardianPage,
});

const seed = [
  { who: "guardian", t: "I noticed agent.cartographer attempted a 14MB export 3 times in the last hour. I quarantined the calls and suggest a size limit policy. Want me to draft it?" },
];

function GuardianPage() {
  const [msgs, setMsgs] = useState(seed);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    setMsgs((m) => [
      ...m,
      { who: "you", t: input },
      { who: "guardian", t: "Acknowledged. I'll prepare a simulation and post it in Shield for review." },
    ]);
    setInput("");
  }

  return (
    <DashboardLayout breadcrumb="Guardian AI">
      <PageHeader
        kicker="Guardian"
        title="Your 24/7 security copilot."
        subtitle="Ask why a signal fired, request a policy draft, or simulate an enforcement before it ships."
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Panel title="Conversation" icon={Brain} tag="gemini · live">
          <div className="space-y-4 min-h-[360px]">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.who === "you" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className="h-8 w-8 rounded-md shrink-0 grid place-items-center text-xs font-mono font-bold"
                  style={{
                    background:
                      m.who === "guardian"
                        ? "var(--gradient-primary)"
                        : "var(--secondary)",
                    color: m.who === "guardian" ? "var(--primary-foreground)" : undefined,
                  }}
                >
                  {m.who === "guardian" ? "G" : "U"}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    m.who === "guardian"
                      ? "bg-card border border-border/60"
                      : "bg-primary/15 border border-primary/30"
                  }`}
                >
                  {m.t}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2 border-t border-border/40 pt-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask Guardian about any signal, agent or policy…"
              className="flex-1 h-11 px-4 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:border-primary"
            />
            <button
              onClick={send}
              className="h-11 px-4 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2 hover:opacity-90"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Sentinel" icon={Sparkles}>
            <div className="relative h-40 grid place-items-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-pulse-ring" />
              <img src={mascot} alt="" className="relative h-36 w-36 object-contain animate-float" />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Guardian online · scanning all fleets
            </p>
          </Panel>
          <Panel title="Quick prompts">
            <ul className="space-y-2 text-sm">
              {[
                "Why was the last critical alert raised?",
                "Draft a policy to block PII in exports.",
                "Summarize the last 24h posture.",
                "Which agent has the riskiest scope?",
              ].map((q) => (
                <li
                  key={q}
                  onClick={() => setInput(q)}
                  className="cursor-pointer rounded-md border border-border/60 bg-card/40 px-3 py-2 hover:border-primary/60"
                >
                  {q}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
