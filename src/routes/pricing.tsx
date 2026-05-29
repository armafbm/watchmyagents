import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Shield } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/CTA";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — WatchMyAgents" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for runtime AI agent security. Start free. Pay as you scale — from Starter to Enterprise.",
      },
      { property: "og:title", content: "Pricing — WatchMyAgents" },
      {
        property: "og:description",
        content: "Start free. Pay as you scale. Plans from $0 to Enterprise.",
      },
    ],
  }),
});

type Tier = {
  name: string;
  agents: string;
  monthlyPrice: number | null;
  monthlyAnnual: number | null;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
  badge?: string;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    agents: "1 agent",
    monthlyPrice: 0,
    monthlyAnnual: 0,
    features: ["Basic monitoring", "7-day history", "Community support", "1 workspace"],
    cta: "Get started",
    ctaHref: "/auth/signup",
  },
  {
    name: "Pro",
    agents: "Up to 10 agents",
    monthlyPrice: 29,
    monthlyAnnual: 20.3,
    features: ["Advanced monitoring", "Smart alerts", "90-day history", "Email support (24h)", "Webhooks"],
    cta: "Start free trial",
    ctaHref: "/auth/signup",
  },
  {
    name: "Pro+",
    agents: "Up to 50 agents",
    monthlyPrice: 79,
    monthlyAnnual: 55.3,
    features: [
      "Security Score",
      "Cost Optimization",
      "1-year history",
      "Email support (4h)",
      "Custom rules",
      "Slack integration",
    ],
    cta: "Start free trial",
    ctaHref: "/auth/signup",
  },
  {
    name: "Business",
    agents: "Up to 500 agents",
    monthlyPrice: 299,
    monthlyAnnual: 209.3,
    features: [
      "Guardian AI",
      "Auto-rollback",
      "Advanced analytics",
      "2-year history",
      "Phone support (2h SLA)",
      "Slack + webhooks",
      "5 team members",
    ],
    cta: "Start free trial",
    ctaHref: "/auth/signup",
    featured: true,
    badge: "Most popular",
  },
  {
    name: "Advanced",
    agents: "Unlimited agents",
    monthlyPrice: 899,
    monthlyAnnual: 629.3,
    features: [
      "Shield security",
      "Custom integrations",
      "Compliance ready",
      "3-year history",
      "Dedicated Slack (1h SLA)",
      "15 team members",
      "Audit logs",
    ],
    cta: "Contact sales",
    ctaHref: "mailto:sales@watchmyagents.com",
  },
  {
    name: "Enterprise",
    agents: "Custom deployment",
    monthlyPrice: null,
    monthlyAnnual: null,
    features: [
      "On-premises option",
      "Dedicated support",
      "Custom SLA",
      "Implementation help",
      "Training included",
      "Custom features",
    ],
    cta: "Contact sales",
    ctaHref: "mailto:sales@watchmyagents.com",
  },
];

function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const getPrice = (t: Tier) => {
    if (t.monthlyPrice === null) return "Custom";
    if (t.monthlyPrice === 0) return "Free";
    const v = billing === "monthly" ? t.monthlyPrice : (t.monthlyAnnual ?? t.monthlyPrice);
    return `$${v.toFixed(0)}`;
  };

  const getNote = (t: Tier) => {
    if (t.monthlyPrice === null) return "Annual contract";
    if (t.monthlyPrice === 0) return "Forever";
    const monthly = billing === "annual" ? (t.monthlyAnnual ?? t.monthlyPrice) : t.monthlyPrice;
    return `$${(monthly * 12).toFixed(0)}/year`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-24 pb-24 px-4 sm:px-6">
        <section className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-mono text-xs tracking-[0.3em] text-primary uppercase">
              ● Pricing
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight mt-4">
              Simple, transparent pricing
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Start free. Pay as you scale.
            </p>
          </div>

          <div className="flex justify-center items-center gap-3 mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Billing:
            </span>
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              {(["monthly", "annual"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={cn(
                    "px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all",
                    billing === b
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
            {billing === "annual" && (
              <span className="bg-primary/15 text-primary text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded">
                Save 30%
              </span>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={cn(
                  "relative flex flex-col rounded-xl border p-7 backdrop-blur transition-all",
                  t.featured
                    ? "border-primary bg-primary/5 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]"
                    : "border-border/60 bg-card/40 hover:border-border"
                )}
              >
                {t.badge && (
                  <span className="absolute -top-3 left-7 bg-primary text-primary-foreground text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded">
                    {t.badge}
                  </span>
                )}
                <div className="font-display text-xl">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.agents}</div>

                <div className="flex items-baseline gap-1.5 mt-5">
                  <span className="font-display text-4xl font-bold">{getPrice(t)}</span>
                  {t.monthlyPrice !== null && t.monthlyPrice !== 0 && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1 mb-5">{getNote(t)}</div>

                <ul className="space-y-2 flex-1 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {t.ctaHref.startsWith("mailto:") ? (
                  <a
                    href={t.ctaHref}
                    className={cn(
                      "block text-center font-mono text-xs uppercase tracking-widest px-4 py-3 rounded-md border transition-all",
                      t.featured
                        ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                        : "border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    {t.cta}
                  </a>
                ) : (
                  <Link
                    to={t.ctaHref}
                    className={cn(
                      "block text-center font-mono text-xs uppercase tracking-widest px-4 py-3 rounded-md border transition-all",
                      t.featured
                        ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                        : "border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    {t.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto mt-16 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              All plans include a 14-day free trial — no credit card required
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Questions?{" "}
              <a href="mailto:sales@watchmyagents.com" className="text-primary hover:underline">
                Talk to sales
              </a>{" "}
              or{" "}
              <a href="mailto:hello@watchmyagents.com" className="text-primary hover:underline">
                schedule a demo
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
