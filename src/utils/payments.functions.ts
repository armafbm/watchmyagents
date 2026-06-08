import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from '@/lib/stripe.server';

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

// Price IDs that should include a 14-day free trial (subscription plans).
const TRIAL_ELIGIBLE_PRICES = new Set([
  'pro_monthly',
  'pro_yearly',
  'pro_plus_monthly',
  'pro_plus_yearly',
  'business_monthly',
  'business_yearly',
]);

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error('Invalid userId');
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

// FORT-4 (P1 Codex audit): whitelist of allowed return_url hosts. Stripe
// reflects this URL back to the browser after a successful checkout —
// an attacker who can dictate it gets a free OAuth-style open redirect.
// The list is intentionally narrow: prod domain + known dev/preview
// hosts. Localhost on common dev ports is also accepted so the developer
// can test the full checkout flow without deploying. Anything else is
// rejected before the Stripe session is created.
const ALLOWED_RETURN_HOSTS = new Set<string>([
  'watchmyagents.com',
  'www.watchmyagents.com',
  'watchmyagents.lovable.app',
  'localhost',
  '127.0.0.1',
]);

function assertSafeReturnUrl(returnUrl: string): void {
  let u: URL;
  try {
    u = new URL(returnUrl);
  } catch {
    throw new Error('Invalid return URL');
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error('Return URL must use http or https');
  }
  if (u.protocol === 'http:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
    throw new Error('Return URL over http is only allowed for localhost');
  }
  if (!ALLOWED_RETURN_HOSTS.has(u.hostname)) {
    throw new Error('Return URL host is not in the allow-list');
  }
}

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      priceId: string;
      quantity?: number;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error('Invalid priceId');
      if (data.quantity != null) {
        const q = Number(data.quantity);
        if (!Number.isInteger(q) || q < 1 || q > 100) throw new Error('Invalid quantity');
      }
      if (data.environment !== 'test' && data.environment !== 'production') {
        throw new Error('Invalid environment');
      }
      // FORT-4: pin return_url to a host we trust. Stripe reflects it
      // back unconditionally so any open input is an open redirect.
      assertSafeReturnUrl(data.returnUrl);
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      // FORT-4: userId + email come from the authenticated server
      // session, never from the client. The previous handler accepted
      // both as input — a malicious client could trivially create a
      // checkout session attached to another user's Stripe customer
      // record (or to an email they don't own) and the webhook would
      // happily wire the subscription up the wrong way.
      const { userId, claims } = context as { userId: string; claims: { email?: string } };
      const customerEmail = typeof claims?.email === 'string' ? claims.email : undefined;

      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error('Price not found');
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === 'recurring';

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: customerEmail,
        userId,
      });

      const includeTrial = isRecurring && TRIAL_ELIGIBLE_PRICES.has(data.priceId);

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
        mode: isRecurring ? 'subscription' : 'payment',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId },
        ...(isRecurring && {
          subscription_data: {
            metadata: { userId },
            ...(includeTrial && { trial_period_days: 14 }),
          },
        }),
        // Stripe API 2026-03-25.dahlia — type defs for SDK 22.x predate this knob.
        managed_payments: { enabled: true },
      } as any);

      return { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { supabase, userId } = context;

    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .eq('environment', data.environment)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_customer_id) {
      return { error: 'No subscription found for this account.' };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
