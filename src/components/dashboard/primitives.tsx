import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { LayerIcon, type LayerKey } from "@/components/site/LayerIcons";

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
  layer,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  layer?: LayerKey;
}) {
  return (
    <div className="flex items-start justify-between gap-6 mb-8">
      <div className="flex items-start gap-4">
        {layer && (
          <LayerIcon layer={layer} className="h-16 w-16 mt-1" alt={kicker} />
        )}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary mb-2">
            // {kicker}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function Panel({
  title,
  icon: Icon,
  tag,
  children,
  className = "",
}: {
  title?: string;
  icon?: LucideIcon;
  tag?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl ${className}`}
    >
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      {(title || tag) && (
        <header className="relative flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            <h3 className="font-display text-sm font-bold tracking-wide">{title}</h3>
          </div>
          {tag && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {tag}
            </span>
          )}
        </header>
      )}
      <div className="relative p-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className="relative rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 overflow-hidden">
      <div
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{ background: `var(--${tone === "primary" ? "primary" : tone})` }}
      />
      <div className="relative flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className={`h-4 w-4 ${toneClass}`} />}
      </div>
      <div className="relative font-display text-3xl font-bold">{value}</div>
      {delta && (
        <div className={`relative mt-1 font-mono text-[11px] ${toneClass}`}>{delta}</div>
      )}
    </div>
  );
}

export function SevBadge({ sev }: { sev: "CRIT" | "HIGH" | "WARN" | "INFO" | "OK" }) {
  const map = {
    CRIT: "danger",
    HIGH: "warning",
    WARN: "primary",
    INFO: "muted-foreground",
    OK: "success",
  } as const;
  const color = map[sev];
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
      style={{
        background: `color-mix(in oklab, var(--${color}) 18%, transparent)`,
        color: `var(--${color})`,
      }}
    >
      {sev}
    </span>
  );
}
