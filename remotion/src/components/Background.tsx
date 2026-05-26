import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 80) * 40;
  const drift2 = Math.cos(frame / 100) * 60;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* radial glows */}
      <div
        style={{
          position: "absolute",
          top: -200 + drift,
          left: -200 + drift2,
          width: 1100,
          height: 1100,
          background: "radial-gradient(circle, rgba(77,196,245,0.18) 0%, transparent 60%)",
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300 - drift,
          right: -300 + drift,
          width: 1300,
          height: 1300,
          background: "radial-gradient(circle, rgba(124,92,255,0.18) 0%, transparent 60%)",
          filter: "blur(20px)",
        }}
      />
      {/* grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.6,
        }}
      />
      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
