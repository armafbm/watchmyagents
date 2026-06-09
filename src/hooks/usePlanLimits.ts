import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, type SubscriptionTier } from "./useSubscription";

// Must stay in sync with plan_*_limit() functions in supabase/migrations/20260609020000_plan_limits.sql
// null = unlimited
export const PLAN_LIMITS: Record<SubscriptionTier, { agents: number | null; policies: number | null; apiKeys: number | null }> = {
  free:     { agents: 3,   policies: 5,   apiKeys: 1  },
  pro:      { agents: 10,  policies: 25,  apiKeys: 3  },
  pro_plus: { agents: 50,  policies: 100, apiKeys: 5  },
  business: { agents: 500, policies: 500, apiKeys: 10 },
};

export type PlanLimitsState = {
  agents:  { count: number; limit: number | null; atLimit: boolean };
  policies: { count: number; limit: number | null; atLimit: boolean };
  apiKeys: { count: number; limit: number | null; atLimit: boolean };
  loading: boolean;
  tier: SubscriptionTier;
};

export function usePlanLimits(): PlanLimitsState {
  const { tier } = useSubscription();
  const limits = PLAN_LIMITS[tier] ?? PLAN_LIMITS.free;

  const [counts, setCounts] = useState({ agents: 0, policies: 0, apiKeys: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [agentsRes, policiesRes, keysRes] = await Promise.all([
        supabase.from("agents").select("id", { count: "exact", head: true }),
        supabase.from("policies").select("id", { count: "exact", head: true }),
        supabase
          .from("api_keys")
          .select("id", { count: "exact", head: true })
          .is("revoked_at", null),
      ]);
      if (cancelled) return;
      setCounts({
        agents:  agentsRes.count  ?? 0,
        policies: policiesRes.count ?? 0,
        apiKeys: keysRes.count    ?? 0,
      });
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [tier]);

  return {
    agents:  { count: counts.agents,   limit: limits.agents,   atLimit: limits.agents   !== null && counts.agents   >= limits.agents   },
    policies: { count: counts.policies, limit: limits.policies, atLimit: limits.policies !== null && counts.policies >= limits.policies },
    apiKeys: { count: counts.apiKeys,  limit: limits.apiKeys,  atLimit: limits.apiKeys  !== null && counts.apiKeys  >= limits.apiKeys  },
    loading,
    tier,
  };
}

// Parses a Supabase/PostgREST error message and returns the resource name if it's a plan limit error.
// The trigger raises: 'plan_limit_exceeded:<resource> ...'
export function parsePlanLimitError(message: string): string | null {
  const m = message.match(/plan_limit_exceeded:(\w+)/);
  return m ? m[1] : null;
}
