import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { C, F } from "../theme";
import { BrowserFrame } from "../components/Chrome";

export const Scene4Landing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 22 } });

  // Scroll position: simulate browsing the landing page through 3 sections
  const scroll = interpolate(frame, [60, 140, 220, 300, 380], [0, 700, 1400, 2100, 2800], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ marginBottom: 30, opacity: intro, textAlign: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: 5, color: C.primary, textTransform: "uppercase" }}>
          // Landing tour
        </span>
        <h2 style={{ fontFamily: F.display, fontSize: 56, color: C.fg, margin: "10px 0 0 0", letterSpacing: -1 }}>
          watchmyagents.com
        </h2>
      </div>

      <div style={{ transform: `scale(${0.88 + intro * 0.04})`, opacity: intro }}>
        <BrowserFrame url="https://watchmyagents.com" width={1600} height={820}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: C.bg }}>
            <div style={{ transform: `translateY(${-scroll}px)`, transition: "none" }}>
              {/* Section 1: Hero */}
              <FakeHero />
              {/* Section 2: Problem */}
              <FakeProblem />
              {/* Section 3: Loop */}
              <FakeLoop />
              {/* Section 4: Layers */}
              <FakeLayers />
              {/* Section 5: CTA */}
              <FakeCTA />
            </div>
            {/* highlight cursor moving */}
            <Cursor />
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

const FakeHero: React.FC = () => (
  <div style={{ height: 700, padding: 80, display: "flex", flexDirection: "column", justifyContent: "center", background: `linear-gradient(135deg, ${C.bg} 0%, ${C.bg2} 100%)` }}>
    <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: 4, color: C.primary, marginBottom: 20 }}>● RUNTIME CYBERSECURITY FOR AI AGENTS</span>
    <h1 style={{ fontFamily: F.display, fontSize: 100, color: C.fg, lineHeight: 1, margin: 0, letterSpacing: -3 }}>
      Your <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI agents</span>.<br />
      Under protection.
    </h1>
    <p style={{ fontFamily: F.body, fontSize: 22, color: C.muted, marginTop: 30, maxWidth: 800 }}>
      Watch, Guardian and Shield — connected by a live feedback loop.
    </p>
    <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
      <div style={{ padding: "16px 32px", background: C.primary, color: C.bg, fontFamily: F.mono, fontSize: 14, letterSpacing: 3, borderRadius: 6 }}>REQUEST ACCESS</div>
      <div style={{ padding: "16px 32px", border: `1px solid ${C.border}`, color: C.fg, fontFamily: F.mono, fontSize: 14, letterSpacing: 3, borderRadius: 6 }}>SEE THE LOOP →</div>
    </div>
  </div>
);

const FakeProblem: React.FC = () => (
  <div style={{ height: 700, padding: 80, background: C.bg }}>
    <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: 4, color: C.danger }}>// THE PROBLEM</span>
    <h2 style={{ fontFamily: F.display, fontSize: 70, color: C.fg, margin: "16px 0 40px 0" }}>
      Agents go rogue. You see it too late.
    </h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
      {["Prompt injection", "Data exfiltration", "Permission drift"].map((t) => (
        <div key={t} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 30 }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: C.danger, letterSpacing: 3 }}>RISK</div>
          <div style={{ fontFamily: F.display, fontSize: 32, color: C.fg, marginTop: 12 }}>{t}</div>
          <div style={{ fontFamily: F.body, fontSize: 16, color: C.muted, marginTop: 14 }}>Detected, scored and contained — automatically.</div>
        </div>
      ))}
    </div>
  </div>
);

const FakeLoop: React.FC = () => (
  <div style={{ height: 700, padding: 80, background: C.bg2, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center" }}>
      <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: 4, color: C.primary }}>// THE LOOP</span>
      <h2 style={{ fontFamily: F.display, fontSize: 80, color: C.fg, margin: "16px 0 50px 0" }}>One closed feedback loop</h2>
      <div style={{ display: "flex", gap: 30, justifyContent: "center" }}>
        {["WATCH", "GUARDIAN", "SHIELD"].map((n, i) => (
          <div key={n} style={{ width: 220, height: 160, background: C.card, border: `1px solid ${[C.primary, C.accent, "#5ce1a0"][i]}66`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 26, color: C.fg }}>
            {n}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FakeLayers: React.FC = () => (
  <div style={{ height: 700, padding: 80, background: C.bg }}>
    <span style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: 4, color: C.accent }}>// CAPABILITIES</span>
    <h2 style={{ fontFamily: F.display, fontSize: 70, color: C.fg, margin: "16px 0 40px 0" }}>Three layers. Zero blind spots.</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {["Live observability", "Risk scoring", "Adaptive policies", "Native SIEM exports"].map((t) => (
        <div key={t} style={{ padding: 28, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontFamily: F.display, fontSize: 28, color: C.fg }}>✓ {t}</div>
        </div>
      ))}
    </div>
  </div>
);

const FakeCTA: React.FC = () => (
  <div style={{ height: 700, padding: 80, background: `linear-gradient(135deg, ${C.bg2}, ${C.bg})`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    <div>
      <h2 style={{ fontFamily: F.display, fontSize: 100, color: C.fg, margin: 0, letterSpacing: -3 }}>
        Ready to protect your<br />
        <span style={{ background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>IT FORTRESS</span>?
      </h2>
    </div>
  </div>
);

const Cursor: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [40, 200, 380], [200, 1200, 800], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [40, 200, 380], [600, 200, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 28,
        height: 28,
        pointerEvents: "none",
        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))",
      }}
    >
      <svg viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1">
        <path d="M3 2 L3 18 L8 14 L11 21 L14 20 L11 13 L18 13 Z" />
      </svg>
    </div>
  );
};
