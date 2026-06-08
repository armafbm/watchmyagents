import { C, F } from "../theme";

// Reusable browser-like window chrome for "screen" scenes
export const BrowserFrame: React.FC<{
  url: string;
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
}> = ({ url, children, width = 1600, height = 880 }) => (
  <div
    style={{
      width,
      height,
      background: C.bg2,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      boxShadow: "0 60px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        height: 44,
        background: "rgba(0,0,0,0.3)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        gap: 8,
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f57" }} />
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#febc2e" }} />
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28c840" }} />
      <div
        style={{
          marginLeft: 24,
          flex: 1,
          maxWidth: 600,
          height: 26,
          background: C.bg,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          fontFamily: F.mono,
          fontSize: 12,
          color: C.muted,
          border: `1px solid ${C.border}`,
        }}
      >
        <span style={{ color: C.primary, marginRight: 6 }}>●</span>
        {url}
      </div>
    </div>
    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>{children}</div>
  </div>
);

export const Tag: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = C.primary,
}) => (
  <span
    style={{
      fontFamily: F.mono,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 2,
      color,
      padding: "4px 10px",
      borderRadius: 4,
      background: `${color}22`,
      border: `1px solid ${color}55`,
    }}
  >
    {children}
  </span>
);
