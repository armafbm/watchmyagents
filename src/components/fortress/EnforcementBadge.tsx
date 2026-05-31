import { Shield, Eye } from "lucide-react";

export type EnforcementMode = "sync_confirm" | "sync_interrupt" | "detect_only" | null | undefined;

export function isDetectOnly(mode: EnforcementMode): boolean {
  return mode === "detect_only";
}

export function EnforcementBadge({ mode }: { mode: EnforcementMode }) {
  const m = mode ?? "sync_confirm";
  if (m === "detect_only") {
    return (
      <span
        title="Detection-only adapter: WMA surfaces findings but cannot block in real time."
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-warning/15 text-warning border-warning/40"
      >
        <Eye className="h-3 w-3" /> Detect-only
      </span>
    );
  }
  const label = m === "sync_interrupt" ? "Interrupt-capable" : "Block-capable";
  return (
    <span
      title={
        m === "sync_interrupt"
          ? "Adapter can interrupt actions in-flight (no fine-grained confirm)."
          : "Adapter can block, confirm, or allow synchronously."
      }
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-success/15 text-success border-success/40"
    >
      <Shield className="h-3 w-3" /> {label}
    </span>
  );
}
