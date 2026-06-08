import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [{ title: "Checkout complete — WatchMyAgents" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturnPage,
});

function CheckoutReturnPage() {
  const { session_id } = Route.useSearch();

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <span className="font-mono text-xs tracking-[0.3em] text-primary uppercase">
            ● Subscription active
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-3">
            Welcome to WatchMyAgents
          </h1>
          <p className="text-muted-foreground mt-3">
            Your subscription is being provisioned. You'll get full access in a few seconds.
          </p>
          {session_id && (
            <p className="font-mono text-[10px] text-muted-foreground/70 mt-2 truncate">
              Session: {session_id}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest px-5 py-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Open dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/dashboard/settings/subscription"
            className="inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest px-5 py-3 rounded-md border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition"
          >
            Manage subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
