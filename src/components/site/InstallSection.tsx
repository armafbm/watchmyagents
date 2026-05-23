import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle, Terminal } from "lucide-react";

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

const TYPING_SPEED = 35; // ms per char
const STEP_PAUSE = 800; // ms between steps
const LINE_PAUSE = 300; // ms between lines in a step

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

  const getAllLines = useCallback(() => {
    const all: { text: string; type: "command" | "output" | "comment"; step: number }[] = [];
    steps.forEach((step, si) => step.forEach((line) => all.push({ ...line, step: si + 1 })));
    return all;
  }, []);

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

  // Main typing animation
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const allLines = getAllLines();
    const currentStepLines = steps[currentStep - 1];

    if (!currentStepLines) {
      setIsComplete(true);
      setIsPlaying(false);
      return;
    }

    const currentLineObj = currentStepLines[currentLine - 1];

    if (!currentLineObj) {
      // Finished this step — pause then advance
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
          // Line finished
          if (intervalRef.current) clearInterval(intervalRef.current);

          timeoutRef.current = setTimeout(() => {
            setDisplayedLines((prevLines) => {
              const lineToAdd = currentLineObj;
              return [...prevLines, { text: lineToAdd.text, type: lineToAdd.type }];
            });
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
  }, [isPlaying, currentStep, currentLine, isComplete, displayedLines.length, getAllLines]);

  // Cursor blink
  useEffect(() => {
    const blink = setInterval(() => setShowCursor((s) => !s), 800);
    return () => clearInterval(blink);
  }, []);

  // Determine current step from currentStep (or last completed step)
  const activeStep = isComplete ? steps.length : currentStep;

  const renderLineContent = (line: Line, index: number) => {
    const isTypingLine = index === cursorLine && !isComplete && isPlaying;
    const visibleChars = isTypingLine ? charIndex : line.text.length;
    const visibleText = line.text.slice(0, visibleChars);

    return (
      <span>
        {line.type === "command" && (
          <span className="text-primary mr-2">$</span>
        )}
        {visibleText}
        {isTypingLine && (
          <span
            className="inline-block w-[8px] h-[1.1em] bg-white/90 align-middle ml-[1px]"
            style={{ opacity: showCursor ? 1 : 1, verticalAlign: "text-bottom" }}
          />
        )}
      </span>
    );
  };

  return (
    <section id="install" className="relative py-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono uppercase tracking-widest text-primary mb-6">
            <Terminal className="w-3.5 h-3.5" />
            Quick Start
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            How to install it
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Watch it all in 3 steps. Literally 30 seconds.
          </p>
        </div>

        {/* Terminal */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl overflow-hidden border border-border/50 shadow-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
            {/* Terminal header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-white/10"
              style={{ background: "oklch(0.2 1 265)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs font-mono text-muted-foreground">~/agent-project</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={isPlaying ? pause : play}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={reset}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal body */}
            <div
              className="p-5 md:p-6 font-mono text-[14px] leading-relaxed min-h-[360px] overflow-x-auto"
              style={{ background: "#1a1a1a", color: "#00ff00" }}
            >
              {displayedLines.map((line, idx) => (
                <div
                  key={`${idx}-${line.text}`}
                  className="whitespace-pre"
                  style={{
                    color:
                      line.type === "command"
                        ? "#00ff00"
                        : line.type === "comment"
                        ? "#6b7280"
                        : "#e4e4e7",
                  }}
                >
                  {line.type === "command" && <span className="text-primary mr-2">$</span>}
                  {line.text}
                </div>
              ))}

              {/* Typing current line */}
              {!isComplete && isPlaying && steps[currentStep - 1]?.[currentLine - 1] && (
                <div
                  className="whitespace-pre"
                  style={{
                    color:
                      steps[currentStep - 1][currentLine - 1].type === "command"
                        ? "#00ff00"
                        : steps[currentStep - 1][currentLine - 1].type === "comment"
                        ? "#6b7280"
                        : "#e4e4e7",
                  }}
                >
                  {renderLineContent(steps[currentStep - 1][currentLine - 1], cursorLine)}
                </div>
              )}
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {[1, 2, 3].map((stepNum) => {
              const isActive = stepNum === activeStep;
              const isDone = stepNum < activeStep || isComplete;
              return (
                <button
                  key={stepNum}
                  onClick={() => {
                    // Reset and jump to step beginning
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);

                    // Calculate lines to show up to previous step
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
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-mono ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : isDone
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border/50 bg-card/60 text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">
                      {stepNum}
                    </span>
                  )}
                  <span>
                    {stepNum === 1 && "Install"}
                    {stepNum === 2 && "Configure"}
                    {stepNum === 3 && "Deploy"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Success message */}
          {isComplete && (
            <div className="text-center mt-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-success/30 bg-success/10 text-success font-mono text-sm">
                <CheckCircle className="w-4 h-4" />
                That&apos;s it. Your agent is monitored in real-time.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
