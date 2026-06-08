import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagOpacity = spring({ frame, fps, config: { damping: 200 } });
  const titleY = interpolate(
    spring({ frame: frame - 10, fps, config: { damping: 18 } }),
    [0, 1],
    [60, 0],
  );
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const line2 = spring({ frame: frame - 35, fps, config: { damping: 18 } });
  const subOpacity = interpolate(frame, [70, 95], [0, 1], { extrapolateRight: "clamp" });
  const chips = spring({ frame: frame - 110, fps, config: { damping: 20 } });

  const layers = [
    { name: "WATCH", desc: "Observe", color: C.primary },
    { name: "GUARDIAN", desc: "Decide", color: C.accent },
    { name: "SHIELD", desc: "Enforce", color: "#5ce1a0" },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 1500, padding: "0 80px" }}>
        <div
          style={{
            opacity: tagOpacity,
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: 6,
            color: C.primary,
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 5,
              background: C.primary,
              marginRight: 14,
              boxShadow: `0 0 16px ${C.primary}`,
            }}
          />
          Runtime cybersecurity for AI agents
        </div>
        <h1
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 180,
            lineHeight: 0.95,
            margin: 0,
            color: C.fg,
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
            letterSpacing: -4,
          }}
        >
          Your{" "}
          <span
            style={{
              background: C.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI agents
          </span>
          .
        </h1>
        <h1
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 180,
            lineHeight: 0.95,
            margin: "12px 0 60px 0",
            color: C.fg,
            transform: `translateY(${interpolate(line2, [0, 1], [60, 0])}px)`,
            opacity: line2,
            letterSpacing: -4,
          }}
        >
          Under protection.
        </h1>
        <p
          style={{
            opacity: subOpacity,
            fontFamily: F.body,
            fontSize: 28,
            color: C.muted,
            margin: "0 0 60px 0",
            maxWidth: 1100,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.5,
          }}
        >
          Three layers connected by a live feedback loop — observability turned into adaptive
          enforcement.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
          {layers.map((l, i) => {
            const cs = spring({ frame: frame - 110 - i * 8, fps, config: { damping: 18 } });
            return (
              <div
                key={l.name}
                style={{
                  opacity: cs,
                  transform: `translateY(${interpolate(cs, [0, 1], [30, 0])}px) scale(${0.9 + cs * 0.1})`,
                  padding: "20px 36px",
                  borderRadius: 14,
                  background: C.card,
                  border: `1px solid ${l.color}55`,
                  boxShadow: `0 8px 32px ${l.color}22`,
                }}
              >
                <div style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: 4, color: l.color }}>
                  {l.name}
                </div>
                <div style={{ fontFamily: F.display, fontSize: 28, color: C.fg, marginTop: 4 }}>
                  {l.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
