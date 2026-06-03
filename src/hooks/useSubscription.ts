import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { getStripeEnvironment, isPaymentsConfigured } from '@/lib/stripe';

export type SubscriptionRow = {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  environment: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionTier = 'free' | 'pro' | 'pro_plus' | 'business';

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  pro_monthly: 'pro',
  pro_yearly: 'pro',
  pro_plus_monthly: 'pro_plus',
  pro_plus_yearly: 'pro_plus',
  business_monthly: 'business',
  business_yearly: 'business',
};

export function tierFromPriceId(priceId: string | null | undefined): SubscriptionTier {
  if (!priceId) return 'free';
  return PRICE_TO_TIER[priceId] ?? 'free';
}

export function isActiveStatus(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  const future = end === null || end > Date.now();
  if ((sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') && future) {
    return true;
  }
  if (sub.status === 'canceled' && end && end > Date.now()) return true;
  return false;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isPaymentsConfigured()) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const env = (() => {
      try {
        return getStripeEnvironment();
      } catch {
        return 'sandbox' as const;
      }
    })();

    const load = async () => {
      const tryEnv = async (e: string) => {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('environment', e)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return (data as SubscriptionRow | null) ?? null;
      };
      let row = await tryEnv(env);
      if (!row || !isActiveStatus(row)) {
        const other = env === 'live' ? 'sandbox' : 'live';
        const fallback = await tryEnv(other);
        if (fallback) row = fallback;
      }
      if (cancelled) return;
      setSubscription(row);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const tier = tierFromPriceId(subscription?.price_id);
  const isActive = isActiveStatus(subscription);

  return {
    subscription,
    loading,
    tier: isActive ? tier : ('free' as SubscriptionTier),
    isActive,
  };
}
