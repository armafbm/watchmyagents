import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";

const layers = [
  {
    name: "WATCH",
    color: C.primary,
    desc: "Stream every prompt, tool call, response",
    icon: "👁",
  },
  {
    name: "GUARDIAN AI",
    color: C.accent,
    desc: "Detect, score and explain risk in real time",
    icon: "🧠",
  },
  {
    name: "SHIELD",
    color: "#5ce1a0",
    desc: "Enforce policies — block, throttle, escalate",
    icon: "🛡",
  },
];

export const Scene3Loop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ padding: 100, display: "flex", flexDirection: "column" }}>
      <div style={{ opacity: titleOp }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 14,
            letterSpacing: 5,
            color: C.primary,
            textTransform: "uppercase",
          }}
        >
          // The Loop
        </span>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 90,
            color: C.fg,
            margin: "16px 0 8px",
            letterSpacing: -2,
          }}
        >
          Watch <span style={{ color: C.primary }}>→</span> Guardian{" "}
          <span style={{ color: C.accent }}>→</span> Shield
        </h2>
        <p style={{ fontFamily: F.body, fontSize: 26, color: C.muted, margin: 0, maxWidth: 1100 }}>
          A closed feedback loop. Every signal informs the next decision, agent by agent.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          marginTop: 40,
        }}
      >
        {layers.map((l, i) => {
          const card = spring({ frame: frame - 30 - i * 25, fps, config: { damping: 18 } });
          const arrowOp =
            i < 2
              ? interpolate(frame, [80 + i * 25, 110 + i * 25], [0, 1], {
                  extrapolateRight: "clamp",
                })
              : 0;
          return (
            <>
              <div
                key={l.name}
                style={{
                  opacity: card,
                  transform: `translateY(${interpolate(card, [0, 1], [40, 0])}px) scale(${0.9 + card * 0.1})`,
                  width: 380,
                  height: 460,
                  background: C.card,
                  border: `2px solid ${l.color}66`,
                  borderRadius: 24,
                  padding: 40,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: `0 30px 80px ${l.color}33`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -100,
                    right: -100,
                    width: 280,
                    height: 280,
                    background: `radial-gradient(circle, ${l.color}55 0%, transparent 70%)`,
                    filter: "blur(20px)",
                  }}
                />
                <div style={{ fontSize: 80, position: "relative" }}>{l.icon}</div>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: 14,
                      letterSpacing: 4,
                      color: l.color,
                      marginBottom: 12,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} · LAYER
                  </div>
                  <div
                    style={{
                      fontFamily: F.display,
                      fontSize: 46,
                      color: C.fg,
                      lineHeight: 1.05,
                      marginBottom: 16,
                    }}
                  >
                    {l.name}
                  </div>
                  <div
                    style={{ fontFamily: F.body, fontSize: 18, color: C.muted, lineHeight: 1.5 }}
                  >
                    {l.desc}
                  </div>
                </div>
              </div>
              {i < 2 && (
                <div
                  style={{
                    opacity: arrowOp,
                    fontFamily: F.display,
                    fontSize: 70,
                    color: i === 0 ? C.primary : C.accent,
                    transform: `translateX(${interpolate(arrowOp, [0, 1], [-20, 0])}px)`,
                  }}
                >
                  →
                </div>
              )}
            </>
          );
        })}
      </div>

      <div
        style={{
          opacity: interpolate(frame, [380, 430], [0, 1], { extrapolateRight: "clamp" }),
          fontFamily: F.mono,
          fontSize: 16,
          letterSpacing: 4,
          color: C.muted,
          textAlign: "center",
          marginTop: 20,
        }}
      >
        ↻ Continuous feedback · Every signal sharpens the next policy
      </div>
    </AbsoluteFill>
  );
};
