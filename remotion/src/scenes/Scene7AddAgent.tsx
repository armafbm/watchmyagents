import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
} from "remotion";
import { C, F } from "../theme";
import { BrowserFrame } from "../components/Chrome";

// 4 mini-steps: Step1 name/framework, Step2 generated keys, Step3 install, Step4 connected
export const Scene7AddAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 22 } });

  // Step indices (each step ~180 frames)
  const stepStart = [20, 180, 360, 540];
  const currentStep =
    frame < stepStart[1] ? 0 : frame < stepStart[2] ? 1 : frame < stepStart[3] ? 2 : 3;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div style={{ marginBottom: 18, opacity: intro, textAlign: "center" }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 14,
            letterSpacing: 5,
            color: C.primary,
            textTransform: "uppercase",
          }}
        >
          // Onboarding · Add a new agent
        </span>
      </div>

      <div style={{ transform: `scale(${0.85 + intro * 0.05})`, opacity: intro }}>
        <BrowserFrame url="fortress.watchmyagents.com/onboarding" width={1700} height={880}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              background: C.bg,
              padding: 40,
            }}
          >
            {/* Stepper */}
            <div style={{ display: "flex", gap: 14, marginBottom: 28, justifyContent: "center" }}>
              {["Identify", "Generate keys", "Install", "Connected"].map((label, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: i <= currentStep ? C.gradient : C.card,
                      border: `1px solid ${i <= currentStep ? C.primary : C.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: F.mono,
                      fontSize: 14,
                      color: i <= currentStep ? C.bg : C.muted,
                      fontWeight: 700,
                    }}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: 12,
                      letterSpacing: 2,
                      color: i <= currentStep ? C.fg : C.muted,
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                  {i < 3 && (
                    <div
                      style={{
                        width: 60,
                        height: 1,
                        background: i < currentStep ? C.primary : C.border,
                        marginLeft: 6,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div style={{ flex: 1, position: "relative" }}>
              <Sequence from={stepStart[0]} durationInFrames={stepStart[1] - stepStart[0]}>
                <Step1 />
              </Sequence>
              <Sequence from={stepStart[1]} durationInFrames={stepStart[2] - stepStart[1]}>
                <Step2 />
              </Sequence>
              <Sequence from={stepStart[2]} durationInFrames={stepStart[3] - stepStart[2]}>
                <Step3 />
              </Sequence>
              <Sequence from={stepStart[3]} durationInFrames={180}>
                <Step4 />
              </Sequence>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 22 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        position: "absolute",
        inset: 0,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 36,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
};

const Step1: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = "support-bot-prod".slice(0, Math.min(16, Math.floor(frame / 4)));
  const selected = frame > 80;
  return (
    <Panel>
      <h3 style={{ fontFamily: F.display, fontSize: 38, color: C.fg, margin: 0 }}>
        Tell us about your agent
      </h3>
      <p style={{ fontFamily: F.body, fontSize: 17, color: C.muted, margin: "8px 0 28px" }}>
        One identity per environment. You can have many.
      </p>

      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: 3,
            color: C.muted,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Agent name
        </div>
        <div
          style={{
            background: C.bg,
            border: `1px solid ${C.primary}`,
            borderRadius: 8,
            padding: "14px 18px",
            fontFamily: F.mono,
            fontSize: 18,
            color: C.fg,
          }}
        >
          {typed}
          <span style={{ opacity: frame % 20 < 10 ? 1 : 0, color: C.primary }}>▍</span>
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: 3,
            color: C.muted,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Framework
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {[
            { n: "Claude Agent SDK", ready: true },
            { n: "OpenAI Agents", ready: false },
            { n: "LangGraph", ready: false },
            { n: "Custom", ready: false },
          ].map((fw, i) => {
            const isPicked = selected && i === 0;
            return (
              <div
                key={fw.n}
                style={{
                  padding: 16,
                  background: isPicked ? `${C.primary}22` : C.bg,
                  border: `1px solid ${isPicked ? C.primary : C.border}`,
                  borderRadius: 8,
                  fontFamily: F.body,
                  fontSize: 14,
                  color: fw.ready ? C.fg : C.muted,
                  textAlign: "center",
                  position: "relative",
                }}
              >
                {fw.n}
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 9,
                    letterSpacing: 2,
                    color: fw.ready ? "#5ce1a0" : C.muted,
                    marginTop: 6,
                  }}
                >
                  {fw.ready ? "● READY" : "○ SOON"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            padding: "14px 32px",
            background: C.gradient,
            color: C.bg,
            borderRadius: 8,
            fontFamily: F.mono,
            fontSize: 13,
            letterSpacing: 3,
            opacity: selected ? 1 : 0.4,
          }}
        >
          CONTINUE →
        </div>
      </div>
    </Panel>
  );
};

const Step2: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = spring({ frame: frame - 20, fps: 30, config: { damping: 20 } });
  return (
    <Panel>
      <h3 style={{ fontFamily: F.display, fontSize: 38, color: C.fg, margin: 0 }}>
        Your credentials
      </h3>
      <p style={{ fontFamily: F.body, fontSize: 17, color: C.muted, margin: "8px 0 28px" }}>
        Stored once. Used to authenticate this agent at runtime.
      </p>

      {[
        { label: "Agent ID", value: "agent_01XaNB4M88ZvcW8FoQ5GC14A", color: C.primary },
        {
          label: "Watch My Agent API key",
          value: "wma_147e3a5d2eae405bb4279e13aeb4e461",
          color: C.accent,
        },
        {
          label: "Framework provider key (Anthropic)",
          value: "sk-ant-•••••••••••••••••••••••",
          color: "#5ce1a0",
        },
      ].map((row, i) => {
        const s = spring({ frame: frame - 20 - i * 10, fps: 30, config: { damping: 20 } });
        return (
          <div
            key={row.label}
            style={{
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
              marginBottom: 16,
              padding: 18,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ minWidth: 280 }}>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: 3,
                  color: row.color,
                  textTransform: "uppercase",
                }}
              >
                {row.label}
              </div>
            </div>
            <div style={{ flex: 1, fontFamily: F.mono, fontSize: 16, color: C.fg }}>
              {row.value}
            </div>
            <div
              style={{
                padding: "8px 14px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontFamily: F.mono,
                fontSize: 11,
                color: C.muted,
                letterSpacing: 2,
              }}
            >
              COPY
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            padding: "14px 32px",
            background: C.gradient,
            color: C.bg,
            borderRadius: 8,
            fontFamily: F.mono,
            fontSize: 13,
            letterSpacing: 3,
            opacity: reveal,
          }}
        >
          INSTALL THE SHIELD →
        </div>
      </div>
    </Panel>
  );
};

const Step3: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = [
    { txt: "npm install -g watchmyagents", t: 10, color: C.fg },
    { txt: 'export ANTHROPIC_API_KEY="sk-ant-..."', t: 50, color: C.fg },
    { txt: 'export WMA_API_KEY="wma_147e3a5d2eae405bb4279e13aeb4e461"', t: 90, color: C.fg },
    { txt: "wma-shield --agent-id agent_01XaNB4M88ZvcW8FoQ5GC14A", t: 130, color: C.primary },
  ];
  return (
    <Panel>
      <h3 style={{ fontFamily: F.display, fontSize: 38, color: C.fg, margin: 0 }}>
        Wrap your agent
      </h3>
      <p style={{ fontFamily: F.body, fontSize: 17, color: C.muted, margin: "8px 0 28px" }}>
        One command. Every prompt, tool call and response is now streamed to your fortress.
      </p>

      <div
        style={{
          flex: 1,
          background: "#05080f",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 28,
          fontFamily: F.mono,
          fontSize: 17,
          overflow: "hidden",
          boxShadow: `inset 0 0 60px rgba(77,196,245,0.05)`,
        }}
      >
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 12,
            color: C.muted,
            marginBottom: 16,
            letterSpacing: 2,
          }}
        >
          ● ● ● &nbsp;&nbsp; bash · ~/your-project
        </div>
        {lines.map((l, i) => {
          const op = interpolate(frame, [l.t, l.t + 12], [0, 1], { extrapolateRight: "clamp" });
          const len = Math.max(0, Math.floor((frame - l.t) * 2.5));
          return (
            <div key={i} style={{ opacity: op, marginBottom: 14, color: l.color, lineHeight: 1.5 }}>
              <span style={{ color: C.primary, marginRight: 10 }}>$</span>
              {l.txt.slice(0, Math.min(l.txt.length, len))}
              {len < l.txt.length && op > 0 && (
                <span style={{ opacity: frame % 20 < 10 ? 1 : 0, color: C.primary }}>▍</span>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

const Step4: React.FC = () => {
  const frame = useCurrentFrame();
  const s = spring({ frame, fps: 30, config: { damping: 14 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.05;
  return (
    <Panel>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            background: C.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
            color: C.bg,
            marginBottom: 30,
            transform: `scale(${s * pulse})`,
            boxShadow: `0 0 80px ${C.primary}88`,
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontFamily: F.display,
            fontSize: 56,
            color: C.fg,
            margin: 0,
            opacity: s,
            letterSpacing: -1,
          }}
        >
          Agent connected.
        </h3>
        <p
          style={{
            fontFamily: F.body,
            fontSize: 22,
            color: C.muted,
            marginTop: 16,
            opacity: s,
            maxWidth: 700,
          }}
        >
          <span style={{ color: "#5ce1a0" }}>●</span> support-bot-prod is now streaming to Watch ·
          Guardian is scoring · Shield is enforcing.
        </p>

        <div style={{ marginTop: 30, opacity: s, display: "flex", gap: 14 }}>
          {["WATCH", "GUARDIAN", "SHIELD"].map((n) => (
            <div
              key={n}
              style={{
                padding: "10px 18px",
                background: C.bg,
                border: `1px solid #5ce1a055`,
                borderRadius: 6,
                fontFamily: F.mono,
                fontSize: 12,
                letterSpacing: 3,
                color: "#5ce1a0",
              }}
            >
              ● {n} LIVE
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};
