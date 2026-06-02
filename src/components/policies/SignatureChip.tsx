import { CheckCircle2, AlertTriangle, ShieldOff } from "lucide-react";

export type SignatureChipProps = {
  signature: string | null;
  signingKeyId: string | null;
  signedAt: string | null;
  /** validity windows of signing keys, keyed by kid, used to mark expired-but-valid */
  keyValidUntilByKid?: Record<string, string | null | undefined>;
};

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export function SignatureChip({
  signature,
  signingKeyId,
  signedAt,
  keyValidUntilByKid,
}: SignatureChipProps) {
  if (!signature || !signingKeyId) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-danger/15 text-danger border-danger/30">
        <ShieldOff className="h-3 w-3" /> Unsigned — SDK v1.1.5+ will drop
      </span>
    );
  }

  const validUntil = keyValidUntilByKid?.[signingKeyId];
  const expired = validUntil ? new Date(validUntil).getTime() < Date.now() : false;

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-warning/15 text-warning border-warning/30">
        <AlertTriangle className="h-3 w-3" />
        Signed by {signingKeyId} · {signedAt ? timeAgo(signedAt) : "?"} (expired key)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-success/15 text-success border-success/30">
      <CheckCircle2 className="h-3 w-3" />
      Signed by {signingKeyId} · {signedAt ? timeAgo(signedAt) : "?"}
    </span>
  );
}
