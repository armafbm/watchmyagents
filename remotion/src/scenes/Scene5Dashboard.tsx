import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { C, F } from "../theme";
import { BrowserFrame } from "../components/Chrome";

const incidents = [
  { sev: "CRITICAL", color: C.danger, agent: "agent.support · prod", cat: "Data access", signal: "Suspected exfiltration", t: 80 },
  { sev: "HIGH", color: C.warn, agent: "agent.crm · prod", cat: "Prompt injection", signal: "Malicious pattern in input", t: 110 },
  { sev: "WARN", color: C.primary, agent: "agent.finance · prod", cat: "Permissions", signal: "Scope=admin on read task", t: 140 },
  { sev: "INFO", color: "#5ce1a0", agent: "agent.ops · prod", cat: "Health", signal: "Heartbeat ok", t: 170 },
];

export const Scene5Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 22 } });
  const sidebar = spring({ frame: frame - 10, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 50 }}>
      <div style={{ marginBottom: 22, opacity: intro, textAlign: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 14, letterSpacing: 5, color: C.accent, textTransform: "uppercase" }}>
          // WMA Fortress · Command center
        </span>
      </div>

      <div style={{ transform: `scale(${0.88 + intro * 0.04})`, opacity: intro }}>
        <BrowserFrame url="fortress.watchmyagents.com/dashboard" width={1700} height={880}>
          <div style={{ display: "flex", height: "100%", background: C.bg }}>
            {/* Sidebar */}
            <div
              style={{
                width: 230,
                background: C.bg2,
                borderRight: `1px solid ${C.border}`,
                padding: 24,
                transform: `translateX(${interpolate(sidebar, [0, 1], [-100, 0])}px)`,
              }}
            >
              <div style={{ fontFamily: F.display, fontSize: 22, color: C.fg, marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 14, height: 14, background: C.gradient, borderRadius: 3 }} />
                FORTRESS
              </div>
              {["Overview", "Watch", "Guardian", "Shield", "Legions", "Reports", "Settings"].map((s, i) => (
                <div
                  key={s}
                  style={{
                    fontFamily: F.body,
                    fontSize: 15,
                    color: i === 0 ? C.fg : C.muted,
                    padding: "10px 14px",
                    marginBottom: 4,
                    borderRadius: 8,
                    background: i === 0 ? `${C.primary}22` : "transparent",
                    borderLeft: i === 0 ? `3px solid ${C.primary}` : "3px solid transparent",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>

            {/* Main */}
            <div style={{ flex: 1, padding: 36, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                  <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: 4, color: C.muted }}>// OVERVIEW</div>
                  <div style={{ fontFamily: F.display, fontSize: 38, color: C.fg, marginTop: 4 }}>Live alerts & incidents</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: "#5ce1a0", padding: "8px 14px", border: `1px solid #5ce1a055`, borderRadius: 6, letterSpacing: 3 }}>● REALTIME</div>
                </div>
              </div>

              {/* KPI row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
                {[
                  { k: "Agents", v: "12", col: C.primary },
                  { k: "Signals / 24h", v: "8,412", col: C.accent },
                  { k: "Blocked", v: "37", col: C.danger },
                  { k: "Avg risk", v: "0.23", col: "#5ce1a0" },
                ].map((kpi, i) => {
                  const s = spring({ frame: frame - 40 - i * 6, fps, config: { damping: 18 } });
                  const v = interpolate(s, [0, 1], [0, parseFloat(kpi.v.replace(",", "")) || 0]);
                  return (
                    <div
                      key={kpi.k}
                      style={{
                        opacity: s,
                        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
                        padding: 18,
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 3, color: C.muted, textTransform: "uppercase" }}>{kpi.k}</div>
                      <div style={{ fontFamily: F.display, fontSize: 36, color: kpi.col, marginTop: 6 }}>
                        {kpi.v.includes(".") ? v.toFixed(2) : Math.round(v).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Alerts table */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1.5fr 1fr 2fr", padding: "14px 20px", background: "rgba(0,0,0,0.3)", fontFamily: F.mono, fontSize: 10, letterSpacing: 3, color: C.muted, textTransform: "uppercase" }}>
                  <div>Severity</div>
                  <div>Agent / env</div>
                  <div>Category</div>
                  <div>Signal</div>
                </div>
                {incidents.map((inc, i) => (
                  <Sequence key={i} from={inc.t} durationInFrames={480 - inc.t}>
                    <Row {...inc} />
                  </Sequence>
                ))}
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

const Row: React.FC<{ sev: string; color: string; agent: string; cat: string; signal: string }> = ({ sev, color, agent, cat, signal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 20 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
        display: "grid",
        gridTemplateColumns: "120px 1.5fr 1fr 2fr",
        padding: "16px 20px",
        borderTop: `1px solid ${C.border}`,
        alignItems: "center",
      }}
    >
      <div>
        <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color, background: `${color}22`, padding: "5px 10px", borderRadius: 4 }}>
          {sev}
        </span>
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 14, color: C.fg }}>{agent}</div>
      <div style={{ fontFamily: F.body, fontSize: 14, color: C.muted }}>{cat}</div>
      <div style={{ fontFamily: F.body, fontSize: 14, color: C.fg }}>{signal}</div>
    </div>
  );
};
