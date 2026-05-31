import { useState } from "react";
import { Eye, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function maskSessionId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

type Props = {
  sessionId: string;
  signalId?: string | null;
  /** Pre-revealed value (e.g. from a bulk reveal_session_ids call) */
  revealedValue?: string | null;
  /** Bulk reveal handler — if provided, used instead of single-id RPC */
  onRequestReveal?: () => Promise<string | null>;
};

/**
 * Renders an opaque vendor session id, masked by default.
 * Reveal + copy actions are audited server-side.
 */
export function SessionIdChip({ sessionId, signalId, revealedValue, onRequestReveal }: Props) {
  const [revealed, setRevealed] = useState<string | null>(revealedValue ?? null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const display = revealed ?? maskSessionId(sessionId);

  async function handleReveal() {
    if (revealed) return;
    setBusy(true);
    try {
      if (onRequestReveal) {
        const v = await onRequestReveal();
        if (v) setRevealed(v);
        else toast.error("Reveal denied — incident_analyst role required.");
      } else if (signalId) {
        // Single-shot reveal via RPC (audits each id on this signal)
        const { data, error } = await supabase.rpc("reveal_session_ids", { p_signal_id: signalId });
        if (error) {
          toast.error(`Reveal denied: ${error.message}`);
        } else {
          const arr = (data as string[] | null) ?? [];
          const match = arr.find((s) => s === sessionId || maskSessionId(s) === sessionId);
          setRevealed(match ?? arr[0] ?? sessionId);
        }
      } else if (signalId) {
        setRevealed(sessionId);
        await supabase.rpc("log_session_id_access", {
          p_signal_id: signalId,
          p_session_id: sessionId,
          p_action: "reveal",
        });
      } else {
        setRevealed(sessionId);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    const value = revealed ?? sessionId;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      await supabase.rpc("log_session_id_access", {
        p_signal_id: signalId ?? null,
        p_session_id: value,
        p_action: "copy",
      });
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <span className="inline-flex items-center gap-1 rounded border border-border/40 bg-background/60 px-1.5 py-0.5 font-mono text-[11px]">
      <span className="text-foreground/80 select-all">{display}</span>
      {!revealed && (
        <button
          type="button"
          onClick={handleReveal}
          disabled={busy}
          title="Reveal full session id (audited)"
          className="text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          <Eye className="h-3 w-3" />
        </button>
      )}
      <button
        type="button"
        onClick={handleCopy}
        title="Copy session id (audited)"
        className="text-muted-foreground hover:text-primary"
      >
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  );
}

export function SessionIdList({
  sessionIds,
  signalId,
}: {
  sessionIds: string[] | null | undefined;
  signalId?: string | null;
}) {
  if (!sessionIds || sessionIds.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        Session ids
      </span>
      {sessionIds.map((s) => (
        <SessionIdChip key={s} sessionId={s} signalId={signalId ?? null} />
      ))}
    </div>
  );
}
