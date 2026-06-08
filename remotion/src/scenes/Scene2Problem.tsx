import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
} from "remotion";
import { C, F } from "../theme";

const alerts = [
  { sev: "CRITICAL", color: C.danger, msg: "agent.support → exfiltrated 2.4 GB", t: 20 },
  { sev: "HIGH", color: C.warn, msg: "agent.crm → prompt injection detected", t: 60 },
  { sev: "CRITICAL", color: C.danger, msg: "agent.finance → unauthorized API call", t: 100 },
  { sev: "WARN", color: C.primary, msg: "agent.ops → scope=admin on read task", t: 140 },
  { sev: "HIGH", color: C.warn, msg: "agent.support → 47 retries in 12s", t: 180 },
];

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = spring({ frame, fps, config: { damping: 200 } });
  const subOp = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{ padding: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      <div style={{ opacity: titleOp, marginBottom: 24 }}>
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 14,
            letterSpacing: 5,
            color: C.danger,
            textTransform: "uppercase",
          }}
        >
          // The problem
        </span>
      </div>
      <h2
        style={{
          fontFamily: F.display,
          fontWeight: 700,
          fontSize: 110,
          lineHeight: 1,
          color: C.fg,
          margin: 0,
          opacity: titleOp,
          letterSpacing: -3,
        }}
      >
        Agents go rogue.
        <br />
        <span style={{ color: C.danger }}>You see it too late.</span>
      </h2>
      <p
        style={{
          opacity: subOp,
          fontFamily: F.body,
          fontSize: 26,
          color: C.muted,
          marginTop: 32,
          marginBottom: 60,
          maxWidth: 900,
        }}
      >
        Logs are scattered. Permissions drift. By the time you trace the leak, the data is gone.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 1400 }}>
        {alerts.map((a, i) => (
          <Sequence key={i} from={a.t} durationInFrames={300 - a.t} layout="none">
            <AlertRow {...a} />
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const AlertRow: React.FC<{ sev: string; color: string; msg: string }> = ({ sev, color, msg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
        background: C.card,
        border: `1px solid ${color}55`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        padding: "18px 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        boxShadow: `0 4px 24px ${color}22`,
      }}
    >
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 12,
          letterSpacing: 3,
          color,
          background: `${color}22`,
          padding: "6px 12px",
          borderRadius: 4,
          minWidth: 110,
          textAlign: "center",
        }}
      >
        {sev}
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 22, color: C.fg }}>{msg}</span>
      <span style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 14, color: C.muted }}>
        {Math.floor(Math.random() * 60)}s ago
      </span>
    </div>
  );
};
