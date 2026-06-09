import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}
function subsTable() {
  return getSupabase().from("subscriptions") as any;
}

// Must stay in sync with PRICE_TO_TIER in src/hooks/useSubscription.ts
const PRICE_TO_PLAN: Record<string, string> = {
  pro_monthly: "pro",
  pro_yearly: "pro",
  pro_plus_monthly: "pro_plus",
  pro_plus_yearly: "pro_plus",
  business_monthly: "business",
  business_yearly: "business",
};

async function syncCustomerPlan(
  userId: string,
  priceId: string | null | undefined,
  status: string,
) {
  const isActive = ["active", "trialing"].includes(status);
  const plan = isActive && priceId ? (PRICE_TO_PLAN[priceId] ?? "free") : "free";
  // Cast needed: generated Supabase types lag behind manual migrations.
  const { error } = await (getSupabase().from("customers") as any)
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    console.error("[payments-webhook] syncCustomerPlan failed:", userId, plan, error.message);
  }
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function resolvePriceId(item: any): string {
  return item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("[payments-webhook] No userId in subscription metadata", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const priceId = resolvePriceId(item);

  await Promise.all([
    subsTable().upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: item?.price?.product ?? "",
        price_id: priceId ?? "",
        status: subscription.status,
        current_period_start: isoFromUnix(periodStart),
        current_period_end: isoFromUnix(periodEnd),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        trial_end: isoFromUnix(subscription.trial_end),
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    ),
    syncCustomerPlan(userId, priceId, subscription.status),
  ]);
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const priceId = resolvePriceId(item);

  // Resolve userId from the subscriptions table (not always in metadata on updates)
  const { data: subRow } = await subsTable()
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  const userId: string | null = subRow?.user_id ?? null;

  await Promise.all([
    subsTable()
      .update({
        status: subscription.status,
        product_id: item?.price?.product ?? "",
        price_id: priceId ?? "",
        current_period_start: isoFromUnix(periodStart),
        current_period_end: isoFromUnix(periodEnd),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        trial_end: isoFromUnix(subscription.trial_end),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id)
      .eq("environment", env),
    userId ? syncCustomerPlan(userId, priceId, subscription.status) : Promise.resolve(),
  ]);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  const { data: subRow } = await subsTable()
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  const userId: string | null = subRow?.user_id ?? null;

  await Promise.all([
    subsTable()
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id)
      .eq("environment", env),
    userId ? syncCustomerPlan(userId, null, "canceled") : Promise.resolve(),
  ]);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.trial_will_end":
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.payment_failed":
    case "invoice.payment_succeeded":
      console.log("[payments-webhook] Invoice event:", event.type);
      break;
    default:
      console.log("[payments-webhook] Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[payments-webhook] Invalid env query param:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[payments-webhook] error:", e);
          // Signature/timestamp errors are permanent — 400 tells Stripe not to retry.
          // DB or transient errors — 500 tells Stripe to retry automatically.
          const isSignatureError =
            e instanceof Error &&
            (e.message.includes("signature") || e.message.includes("timestamp"));
          if (isSignatureError) {
            return new Response("Invalid webhook signature", { status: 400 });
          }
          return new Response("Webhook processing error", { status: 500 });
        }
      },
    },
  },
});
