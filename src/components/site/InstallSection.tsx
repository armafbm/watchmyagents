import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Terminal, Package, Key, Rocket } from "lucide-react";

interface Line {
  text: string;
  type: "command" | "output" | "comment";
}

const steps: Line[][] = [
  [
    { text: "npm install watchmyagent --save", type: "command" },
    { text: "✓ watchmyagent@1.2.5 installed", type: "output" },
  ],
  [
    { text: "export ANTHROPIC_API_KEY=\"sk-ant-xxxxxxxxxxxxx\"", type: "command" },
    { text: "# Or: export OPENAI_API_KEY=\"sk-xxxxx\"", type: "comment" },
    { text: "# Or: export LANGCHAIN_API_KEY=\"lc-xxxxx\"", type: "comment" },
  ],
  [
    { text: "cat > agent.js << 'EOF'", type: "command" },
    { text: "const watchMyAgent = require('watchmyagent');", type: "output" },
    { text: "", type: "output" },
    { text: "const agent = watchMyAgent.init({", type: "output" },
    { text: "  agentId: 'agent_xxxxxxxxxxxxx',", type: "output" },
    { text: "  apiProvider: 'anthropic'", type: "output" },
    { text: "});", type: "output" },
    { text: "", type: "output" },
    { text: "agent.run({ task: 'Your task here' });", type: "output" },
    { text: "EOF", type: "command" },
    { text: "node agent.js", type: "command" },
    { text: "✓ Agent connected to WatchMyAgent", type: "output" },
    { text: "✓ Real-time monitoring active", type: "output" },
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
    <section id="install" className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
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
        </div>

        {/* Split layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* LEFT — Explanation */}
          <div className="flex flex-col justify-center">
            <div className="space-y-6">
              <div className="font-mono text-xs uppercase tracking-widest" style={{ color: BLUE_ACCENT }}>
                Step 0{activeStep} / 03 — {activeExplanation.label}
              </div>
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border"
                  style={{ borderColor: `${BLUE_ACCENT}55`, background: `${BLUE_ACCENT}15` }}
                >
                  <ActiveIcon className="w-6 h-6" style={{ color: BLUE_ACCENT }} />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">{activeExplanation.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{activeExplanation.desc}</p>
                </div>
              </div>

              {/* Step roadmap */}
              <div className="space-y-2 pt-4 border-t border-border/40">
                {explanations.map((e, i) => {
                  const n = i + 1;
                  const isActive = n === activeStep && !isComplete;
                  const isDone = n < activeStep || isComplete;
                  return (
                    <button
                      key={e.label}
                      onClick={() => jumpToStep(n)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left hover:bg-card/60"
                      style={{
                        background: isActive ? `${BLUE_ACCENT}12` : "transparent",
                        border: `1px solid ${isActive ? `${BLUE_ACCENT}55` : "transparent"}`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0"
                        style={{
                          background: isDone ? "oklch(0.6 0.18 145 / 0.2)" : `${BLUE_ACCENT}20`,
                          color: isDone ? "oklch(0.75 0.18 145)" : BLUE_ACCENT,
                        }}
                      >
                        {isDone ? <CheckCircle className="w-4 h-4" /> : n}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          {e.label}
                        </div>
                        <div className="text-sm font-medium truncate">{e.title}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Live terminal */}
          <div>
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
