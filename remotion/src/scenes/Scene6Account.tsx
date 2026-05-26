import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, F } from "../theme";

export const Scene6Account: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 22 } });
  const card = spring({ frame: frame - 20, fps, config: { damping: 18 } });
  const dropdown = spring({ frame: frame - 60, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div style={{ marginBottom: 30, opacity: intro, textAlign: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: 5, color: C.primary, textTransform: "uppercase" }}>
          // Signed in
        </span>
        <h2 style={{ fontFamily: F.display, fontSize: 64, color: C.fg, margin: "12px 0 0 0", letterSpacing: -2 }}>
          Your fortress, your team.
        </h2>
      </div>

      <div
        style={{
          opacity: card,
          transform: `translateY(${interpolate(card, [0, 1], [40, 0])}px) scale(${0.92 + card * 0.08})`,
          width: 720,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: 40,
          boxShadow: `0 30px 80px rgba(0,0,0,0.5)`,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 28 }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              background: C.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.display,
              fontSize: 38,
              color: C.bg,
              fontWeight: 700,
              boxShadow: `0 0 30px ${C.primary}66`,
            }}
          >
            A
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontSize: 30, color: C.fg }}>Arma</div>
            <div style={{ fontFamily: F.mono, fontSize: 17, color: C.primary, marginTop: 4 }}>arma@talkytranslate.com</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: C.muted, marginTop: 8, letterSpacing: 2 }}>● ADMIN · TALKYTRANSLATE WORKSPACE</div>
          </div>
        </div>

        <div style={{ height: 1, background: C.border, margin: "8px 0 20px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { k: "Active agents", v: "0", c: C.muted },
            { k: "API keys", v: "1", c: C.primary },
            { k: "Plan", v: "Free trial", c: C.accent },
            { k: "Region", v: "EU · Paris", c: C.fg },
          ].map((kpi) => (
            <div key={kpi.k} style={{ padding: 16, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, color: C.muted, textTransform: "uppercase" }}>{kpi.k}</div>
              <div style={{ fontFamily: F.display, fontSize: 24, color: kpi.c, marginTop: 6 }}>{kpi.v}</div>
            </div>
          ))}
        </div>

        {/* CTA "Add new agent" highlighted */}
        <div
          style={{
            opacity: dropdown,
            transform: `translateY(${interpolate(dropdown, [0, 1], [20, 0])}px)`,
            marginTop: 24,
            padding: "18px 24px",
            background: C.gradient,
            color: C.bg,
            borderRadius: 10,
            fontFamily: F.mono,
            fontSize: 14,
            letterSpacing: 3,
            textAlign: "center",
            cursor: "pointer",
            boxShadow: `0 12px 40px ${C.primary}55`,
          }}
        >
          + ADD YOUR FIRST AGENT
        </div>
      </div>
    </AbsoluteFill>
  );
};
