export type AgentProvider =
  | "anthropic-managed"
  | "openai-agents"
  | "langgraph"
  | "aws-bedrock-agentcore"
  | "crewai"
  | "generic"
  | (string & {});

type Spec = {
  label: string;
  // semantic tokens only — use oklch chips for brand accents
  className: string;
};

const SPECS: Record<string, Spec> = {
  "anthropic-managed": {
    label: "Anthropic",
    className:
      "bg-[oklch(0.6_0.18_35_/_0.15)] text-[oklch(0.78_0.18_35)] border-[oklch(0.6_0.18_35_/_0.45)]",
  },
  "openai-agents": {
    label: "OpenAI",
    className:
      "bg-[oklch(0.55_0.18_155_/_0.15)] text-[oklch(0.78_0.18_155)] border-[oklch(0.55_0.18_155_/_0.45)]",
  },
  langgraph: {
    label: "LangGraph",
    className:
      "bg-[oklch(0.55_0.18_240_/_0.15)] text-[oklch(0.78_0.18_240)] border-[oklch(0.55_0.18_240_/_0.45)]",
  },
  "aws-bedrock-agentcore": {
    label: "AWS Bedrock",
    className:
      "bg-[oklch(0.6_0.18_55_/_0.15)] text-[oklch(0.8_0.18_55)] border-[oklch(0.6_0.18_55_/_0.45)]",
  },
  crewai: {
    label: "CrewAI",
    className:
      "bg-[oklch(0.55_0.2_290_/_0.15)] text-[oklch(0.78_0.2_290)] border-[oklch(0.55_0.2_290_/_0.45)]",
  },
  generic: {
    label: "Generic",
    className: "bg-muted/40 text-muted-foreground border-border/60",
  },
};

export function ProviderBadge({
  provider,
  className = "",
}: {
  provider: AgentProvider | null | undefined;
  className?: string;
}) {
  const key = provider ?? "anthropic-managed";
  const spec = SPECS[key] ?? {
    label: String(key),
    className: "bg-muted/40 text-muted-foreground border-border/60",
  };
  return (
    <span
      title={`Provider: ${key}`}
      className={`inline-flex items-center px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest ${spec.className} ${className}`}
    >
      {spec.label}
    </span>
  );
}
