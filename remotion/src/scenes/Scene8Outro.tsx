import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";

export const Scene8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame, fps, config: { damping: 18 } });
  const sub = spring({ frame: frame - 30, fps, config: { damping: 22 } });
  const cta = spring({ frame: frame - 60, fps, config: { damping: 14 } });
  const url = interpolate(frame, [120, 160], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ opacity: title, fontFamily: F.mono, fontSize: 14, letterSpacing: 6, color: C.primary, textTransform: "uppercase", marginBottom: 30 }}>
          // WatchMyAgents
        </div>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 170,
            color: C.fg,
            lineHeight: 0.95,
            margin: 0,
            transform: `translateY(${interpolate(title, [0, 1], [60, 0])}px)`,
            opacity: title,
            letterSpacing: -4,
          }}
        >
          Protect your<br />
          <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            IT FORTRESS
          </span>
        </h1>
        <p style={{ opacity: sub, fontFamily: F.body, fontSize: 30, color: C.muted, marginTop: 36, marginBottom: 60 }}>
          Watch. Decide. Enforce. Every agent. Every prompt.
        </p>

        <div
          style={{
            opacity: cta,
            transform: `scale(${0.9 + cta * 0.1})`,
            display: "inline-flex",
            gap: 20,
            alignItems: "center",
            padding: "26px 60px",
            background: C.gradient,
            borderRadius: 14,
            fontFamily: F.mono,
            fontSize: 22,
            letterSpacing: 4,
            color: C.bg,
            boxShadow: `0 30px 90px ${C.primary}66`,
            fontWeight: 700,
          }}
        >
          REQUEST ACCESS →
        </div>

        <div
          style={{
            opacity: url,
            marginTop: 60,
            fontFamily: F.mono,
            fontSize: 22,
            color: C.primary,
            letterSpacing: 4,
          }}
        >
          watchmyagents.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
