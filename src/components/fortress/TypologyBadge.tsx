export type AgentTypology = {
  agent_type: string | null;
  agent_type_stage: string | null;
  agent_type_confidence: number | null;
};

function stageTone(stage: string | null | undefined) {
  if (stage === "stable") return "bg-success/15 text-success border-success/40";
  if (stage === "provisional") return "bg-warning/15 text-warning border-warning/40";
  return "bg-muted/40 text-muted-foreground border-border/60";
}

export function TypologyBadge({ a }: { a: AgentTypology }) {
  if (!a.agent_type) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest bg-muted/40 text-muted-foreground border-border/60"
        title="No typology detected yet — agent hasn't emitted signals."
      >
        awaiting first signal
      </span>
    );
  }
  const conf = a.agent_type_confidence != null ? Math.round(a.agent_type_confidence * 100) : null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest ${stageTone(a.agent_type_stage)}`}
      title="Detected agent typology"
    >
      {a.agent_type}
      {a.agent_type_stage ? ` · ${a.agent_type_stage}` : ""}
      {conf != null ? ` · ${conf}%` : ""}
    </span>
  );
}
