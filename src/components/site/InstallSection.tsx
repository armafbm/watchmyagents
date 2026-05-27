import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Terminal, Package, Key, Rocket } from "lucide-react";

interface Line {
  text: string;
  type: "command" | "output" | "comment";
}

const steps: Line[][] = [
  [
    { text: "npm install -g watchmyagents", type: "command" },
  ],
  [
    { text: "export ANTHROPIC_API_KEY=\"sk-ant-...\"", type: "command" },
    { text: "export WMA_API_KEY=\"wma_147e3a5d2eae405bb4279e13aeb4e461\"", type: "command" },
  ],
  [
    { text: "wma-shield --agent-id agent_01XaNB4M88ZvcW8FoQ5GC14A", type: "command" },
  ],
];

const explanations = [
  {
    icon: Package,
    label: "Install",
    title: "Drop the SDK in",
    desc: "One package, zero config. Works with any Node-based agent runtime — LangChain, custom orchestrators, your own stack.",
  },
  {
    icon: Key,
    label: "Configure",
    title: "Connect your provider",
    desc: "Export your LLM key. WatchMyAgents auto-detects Anthropic, OpenAI or LangChain — no extra setup, no proxy.",
  },
  {
    icon: Rocket,
    label: "Deploy",
    title: "Wrap, run, observe",
    desc: "Initialize once with your agentId. Every prompt, tool call and response is now streamed to your Fortress in real time.",
  },
];

const TYPING_SPEED = 35;
const STEP_PAUSE = 800;
const LINE_PAUSE = 300;

// Tuned blue palette — replaces the previous purple band
const BLUE_BAND = "linear-gradient(90deg, oklch(0.32 0.18 250), oklch(0.42 0.20 235))";
const BLUE_ACCENT = "oklch(0.72 0.18 235)";

export function InstallSection() {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLine, setCurrentLine] = useState(1);
  const [charIndex, setCharIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<{ text: string; type: "command" | "output" | "comment" }[]>([]);
  const [cursorLine, setCursorLine] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentStep(1);
    setCurrentLine(1);
    setCharIndex(1);
    setIsPlaying(true);
    setIsComplete(false);
    setDisplayedLines([]);
    setCursorLine(0);
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    if (!isPlaying || isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const currentStepLines = steps[currentStep - 1];
    if (!currentStepLines) {
      setIsComplete(true);
      setIsPlaying(false);
      return;
    }

    const currentLineObj = currentStepLines[currentLine - 1];
    if (!currentLineObj) {
      timeoutRef.current = setTimeout(() => {
        if (currentStep < steps.length) {
          setCurrentStep((s) => s + 1);
          setCurrentLine(1);
          setCharIndex(1);
        } else {
          setIsComplete(true);
          setIsPlaying(false);
        }
      }, STEP_PAUSE);
      return;
    }

    setCursorLine(displayedLines.length);

    intervalRef.current = setInterval(() => {
      setCharIndex((prev) => {
        if (prev >= currentLineObj.text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          timeoutRef.current = setTimeout(() => {
            setDisplayedLines((prevLines) => [
              ...prevLines,
              { text: currentLineObj.text, type: currentLineObj.type },
            ]);
            setCurrentLine((prevL) => prevL + 1);
            return 1;
          }, LINE_PAUSE);
          return prev;
        }
        return prev + 1;
      });
    }, TYPING_SPEED);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, currentStep, currentLine, isComplete, displayedLines.length]);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor((s) => !s), 800);
    return () => clearInterval(blink);
  }, []);

  const activeStep = isComplete ? steps.length : currentStep;

  const jumpToStep = (stepNum: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const prevLines: { text: string; type: "command" | "output" | "comment" }[] = [];
    for (let s = 0; s < stepNum - 1; s++) {
      steps[s].forEach((l) => prevLines.push({ text: l.text, type: l.type }));
    }
    setDisplayedLines(prevLines);
    setCurrentStep(stepNum);
    setCurrentLine(1);
    setCharIndex(1);
    setIsComplete(false);
    setIsPlaying(true);
  };

  const renderLineContent = (line: Line, index: number) => {
    const isTypingLine = index === cursorLine && !isComplete && isPlaying;
    const visibleChars = isTypingLine ? charIndex : line.text.length;
    const visibleText = line.text.slice(0, visibleChars);
    return (
      <span>
        {line.type === "command" && <span style={{ color: BLUE_ACCENT }} className="mr-2">$</span>}
        {visibleText}
        {isTypingLine && (
          <span
            className="inline-block w-[8px] h-[1.1em] align-middle ml-[1px]"
            style={{ background: BLUE_ACCENT, opacity: showCursor ? 1 : 0.2, verticalAlign: "text-bottom" }}
          />
        )}
      </span>
    );
  };

  const activeExplanation = explanations[activeStep - 1] ?? explanations[explanations.length - 1];
  const ActiveIcon = activeExplanation.icon;

  return (
    <section id="install" className="relative py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono uppercase tracking-widest mb-6"
            style={{ borderColor: `${BLUE_ACCENT}55`, background: `${BLUE_ACCENT}10`, color: BLUE_ACCENT }}
          >
            <Terminal className="w-3.5 h-3.5" />
            Quick Start
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">How to install it</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Watch it all in 3 steps. Literally 30 seconds.
          </p>

          {/* Supported frameworks */}
          <div className="mt-6">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Packages available for
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { name: "Claude Agent", tag: "Anthropic", ready: true, desc: "Native Anthropic SDK — available now." },
                { name: "LangGraph", tag: "LangChain", ready: false, desc: "The most robust framework for building complex, stateful agents with memory, steps, tools, human-in-the-loop and long workflows. LangGraph is built for reliable agent orchestration." },
                { name: "OpenAI", tag: "OpenAI", ready: false },
                { name: "CrewAI", tag: "CrewAI", ready: false },
                { name: "AutoGen / AG2", tag: "Microsoft", ready: false },
                { name: "Google ADK / Vertex", tag: "Google", ready: false },
              ].map((fw) => (
                <div
                  key={fw.name}
                  className="group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: fw.ready ? `${BLUE_ACCENT}55` : "rgba(255,255,255,0.08)",
                    background: fw.ready ? `${BLUE_ACCENT}12` : "rgba(255,255,255,0.03)",
                    color: fw.ready ? BLUE_ACCENT : "rgba(255,255,255,0.5)",
                  }}
                >
                  <span>{fw.name}</span>
                  {fw.ready && (
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: `${BLUE_ACCENT}25`, color: BLUE_ACCENT }}
                    >
                      ready
                    </span>
                  )}
                  {fw.desc && (
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-lg border text-xs text-left opacity-0 group-hover:opacity-100 transition-opacity z-10"
                         style={{ background: "oklch(0.18 0.04 245)", borderColor: `${BLUE_ACCENT}55`, color: "#cfe3ff" }}>
                      <div className="font-semibold mb-1" style={{ color: BLUE_ACCENT }}>{fw.tag}</div>
                      {fw.desc}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Split layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* LEFT — Explanation */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="space-y-6 min-w-0">
              <div className="font-mono text-xs uppercase tracking-widest" style={{ color: BLUE_ACCENT }}>
                Step 03 / 03 — Deploy
              </div>
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div
                  className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border"
                  style={{ borderColor: `${BLUE_ACCENT}55`, background: `${BLUE_ACCENT}15` }}
                >
                  <Rocket className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: BLUE_ACCENT }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 break-words">Wrap, run, observe</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Initialize once with your agentId. Every prompt, tool call and response is now streamed to your Fortress in real time.
                  </p>

                  <ul className="mt-5 space-y-3">
                    {[
                      { n: 1, title: "Framework API key", desc: "The key your application / framework uses to connect to its main provider (Anthropic, OpenAI, …)." },
                      { n: 2, title: "Watch My Agent API key", desc: "The key tied to your Watch My Agent account." },
                      { n: 3, title: "Agent ID from your framework console", desc: "The unique identifier of the agent you created in the framework console." },
                    ].map((item) => (
                      <li key={item.n} className="flex gap-3 min-w-0">
                        <div
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                          style={{ background: `${BLUE_ACCENT}20`, color: BLUE_ACCENT }}
                        >
                          {item.n}
                        </div>
                        <div className="text-sm min-w-0 flex-1">
                          <div className="font-semibold break-words">{item.title}</div>
                          <div className="text-muted-foreground break-words">{item.desc}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>



          {/* RIGHT — Live terminal */}
          <div className="min-w-0">

            <div
              className="rounded-xl overflow-hidden border border-border/50 shadow-2xl"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Terminal header (blue band) */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b border-white/10"
                style={{ background: BLUE_BAND }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs font-mono text-white/80">~/agent-project</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={isPlaying ? pause : play}
                    className="p-1.5 rounded hover:bg-white/15 transition-colors text-white/70 hover:text-white"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={reset}
                    className="p-1.5 rounded hover:bg-white/15 transition-colors text-white/70 hover:text-white"
                    title="Reset"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal body */}
              <div
                className="p-5 md:p-6 font-mono text-[13px] leading-relaxed min-h-[420px] overflow-x-auto"
                style={{ background: "#0b1220", color: "#cfe3ff" }}
              >
                {displayedLines.map((line, idx) => (
                  <div
                    key={`${idx}-${line.text}`}
                    className="whitespace-pre"
                    style={{
                      color:
                        line.type === "command"
                          ? BLUE_ACCENT
                          : line.type === "comment"
                          ? "#64748b"
                          : "#dbeafe",
                    }}
                  >
                    {line.type === "command" && (
                      <span style={{ color: BLUE_ACCENT }} className="mr-2">$</span>
                    )}
                    {line.text}
                  </div>
                ))}

                {!isComplete && isPlaying && steps[currentStep - 1]?.[currentLine - 1] && (
                  <div
                    className="whitespace-pre"
                    style={{
                      color:
                        steps[currentStep - 1][currentLine - 1].type === "command"
                          ? BLUE_ACCENT
                          : steps[currentStep - 1][currentLine - 1].type === "comment"
                          ? "#64748b"
                          : "#dbeafe",
                    }}
                  >
                    {renderLineContent(steps[currentStep - 1][currentLine - 1], cursorLine)}
                  </div>
                )}
              </div>

              {/* In-terminal state bar (3 states) */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-t border-white/10"
                style={{ background: "oklch(0.18 0.04 245)" }}
              >
                {[1, 2, 3].map((stepNum) => {
                  const isActive = stepNum === activeStep && !isComplete;
                  const isDone = stepNum < activeStep || isComplete;
                  const label = explanations[stepNum - 1].label;
                  return (
                    <button
                      key={stepNum}
                      onClick={() => jumpToStep(stepNum)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-mono transition-all"
                      style={{
                        background: isActive
                          ? `${BLUE_ACCENT}25`
                          : isDone
                          ? "oklch(0.6 0.18 145 / 0.18)"
                          : "transparent",
                        border: `1px solid ${
                          isActive
                            ? `${BLUE_ACCENT}80`
                            : isDone
                            ? "oklch(0.6 0.18 145 / 0.4)"
                            : "rgba(255,255,255,0.08)"
                        }`,
                        color: isActive
                          ? BLUE_ACCENT
                          : isDone
                          ? "oklch(0.78 0.18 145)"
                          : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {isDone ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <span className="font-bold">0{stepNum}</span>
                      )}
                      <span className="uppercase tracking-wider">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isComplete && (
              <div className="text-center mt-6 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-success/30 bg-success/10 text-success font-mono text-sm">
                  <CheckCircle className="w-4 h-4" />
                  That&apos;s it. Your agent is monitored in real-time.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
