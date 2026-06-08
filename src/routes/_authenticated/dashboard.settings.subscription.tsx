import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ExternalLink, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useSubscription, tierFromPriceId } from "@/hooks/useSubscription";
import { createPortalSession } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/_authenticated/dashboard/settings/subscription")({
  head: () => ({
    meta: [{ title: "Subscription — WatchMyAgents" }, { name: "robots", content: "noindex" }],
  }),
  component: SubscriptionPage,
});

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
  business: "Business",
};

function SubscriptionPage() {
  const { subscription, loading, isActive } = useSubscription();
  const [busy, setBusy] = useState(false);

  const openPortal = async () => {
    setBusy(true);
    try {
      const env = getStripeEnvironment();
      const res = await createPortalSession({
        data: { environment: env, returnUrl: window.location.href },
      });
      if ("error" in res) throw new Error(res.error);
      window.open(res.url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setBusy(false);
    }
  };

  const tier = isActive ? tierFromPriceId(subscription?.price_id) : "free";
  const tierLabel = TIER_LABEL[tier] ?? "Free";

  return (
    <DashboardLayout breadcrumb="Settings · Subscription">
      <PageHeader
        kicker="Billing"
        title="Subscription"
        subtitle="Manage your plan, billing and invoices."
      />

      {loading ? (
        <Panel>
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading subscription…
          </div>
        </Panel>
      ) : !subscription ? (
        <Panel>
          <div className="py-6 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg">You're on the Free plan</div>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade to unlock Guardian AI, Shield enforcement, and longer history.
              </p>
            </div>
            <a
              href="/pricing"
              className="inline-flex font-mono text-xs uppercase tracking-widest px-5 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              View plans
            </a>
          </div>
        </Panel>
      ) : (
        <div className="space-y-5">
          <Panel>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Current plan
                </div>
                <div className="font-display text-2xl mt-1">{tierLabel}</div>
                <div className="font-mono text-xs text-muted-foreground mt-1">
                  {subscription.price_id}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Status
                </div>
                <div className="font-display text-2xl mt-1 capitalize">
                  {subscription.status.replace("_", " ")}
                </div>
                {subscription.cancel_at_period_end && (
                  <div className="font-mono text-[10px] text-warning mt-1">
                    Cancels at period end
                  </div>
                )}
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {subscription.status === "trialing" ? "Trial ends" : "Renews on"}
                </div>
                <div className="font-display text-base mt-1">
                  {subscription.trial_end && subscription.status === "trialing"
                    ? new Date(subscription.trial_end).toLocaleDateString()
                    : subscription.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : "—"}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Environment
                </div>
                <div className="font-display text-base mt-1 capitalize">
                  {subscription.environment}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={openPortal} disabled={busy} className="gap-2">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage billing
              </Button>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-md border border-border hover:border-primary/60 transition"
              >
                Change plan
              </a>
            </div>
          </Panel>
        </div>
      )}
    </DashboardLayout>
  );
}
