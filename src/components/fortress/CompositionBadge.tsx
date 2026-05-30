import { User, GitBranch, Share2, Users } from "lucide-react";

export type CompositionPattern = "solo" | "hierarchy" | "graph" | "peer" | (string & {});

const SPECS: Record<string, { label: string; Icon: typeof User; className: string }> = {
  solo: {
    label: "solo",
    Icon: User,
    className: "bg-muted/40 text-muted-foreground border-border/60",
  },
  hierarchy: {
    label: "hierarchy",
    Icon: GitBranch,
    className:
      "bg-[oklch(0.55_0.18_240_/_0.15)] text-[oklch(0.78_0.18_240)] border-[oklch(0.55_0.18_240_/_0.45)]",
  },
  graph: {
    label: "graph",
    Icon: Share2,
    className:
      "bg-[oklch(0.55_0.2_290_/_0.15)] text-[oklch(0.78_0.2_290)] border-[oklch(0.55_0.2_290_/_0.45)]",
  },
  peer: {
    label: "peer",
    Icon: Users,
    className:
      "bg-[oklch(0.55_0.18_155_/_0.15)] text-[oklch(0.78_0.18_155)] border-[oklch(0.55_0.18_155_/_0.45)]",
  },
};

export function CompositionBadge({ pattern }: { pattern: CompositionPattern | null | undefined }) {
  const key = pattern ?? "solo";
  const spec = SPECS[key] ?? SPECS.solo;
  const Icon = spec.Icon;
  return (
    <span
      title={`Composition: ${key}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-widest ${spec.className}`}
    >
      <Icon className="h-3 w-3" /> {spec.label}
    </span>
  );
}
