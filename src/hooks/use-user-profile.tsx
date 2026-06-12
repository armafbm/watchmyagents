import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Canonical profile row from public.customers.
 *
 * Centralized so the topbar avatar, the profile settings page, and any
 * future surface (operator dashboard, etc.) read from the same source
 * with React Query caching.
 *
 * IMPORTANT — why this exists:
 * Pre-2026-06-07, avatars were stored as base64 dataURLs in
 * auth.users.user_metadata.avatar_url. A single 2 MB upload pushed JWT
 * size past every reasonable header limit (Node 16KB default, Vercel /
 * CF Workers, Supabase edge gateway), bricking production. We migrated
 * to a public Storage bucket + customers.avatar_url column. JWTs stay
 * tiny; avatars are served as static assets.
 */
export type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: string;
};

export function useUserProfile() {
  const { user } = useAuth();
  const uid = user?.id;
  const queryClient = useQueryClient();
  // Unique per hook instance — prevents channel name collisions when
  // useUserProfile is called by multiple components on the same page
  // (e.g. DashboardLayout + ProfilePage both mount simultaneously).
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;

  // Realtime: push-invalidate cache the moment the customers row changes.
  // Covers display_name, avatar_url, plan — any column. Works across tabs.
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`user-profile-rt-${uid}-${instanceId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "customers",
          filter: `id=eq.${uid}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-profile", uid] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, queryClient]);

  return useQuery<UserProfile | null>({
    queryKey: ["user-profile", uid],
    enabled: !!uid,
    staleTime: 5_000, // Realtime is primary; 5 s is just a safety fallback
    queryFn: async () => {
      if (!uid) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("id, email, display_name, avatar_url, plan")
        .eq("id", uid)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

/**
 * Picks the best avatar source for the given user, in this order:
 * 1. customers.avatar_url (canonical — Storage upload or OAuth URL)
 * 2. auth.users.user_metadata.avatar_url (legacy — only for sessions
 *    minted before the migration; the JWT may still carry one even if
 *    customers.avatar_url is null)
 * 3. null → caller should fall back to initials
 *
 * NOTE: legacy values that are base64 dataURLs (data:image/...) are
 * rejected here. They worked but bricked production via the JWT bloat —
 * we don't want to encourage rendering them once the new flow is live.
 */
export function resolveAvatarUrl(
  profile: UserProfile | null | undefined,
  authUser: { user_metadata?: Record<string, unknown> } | null | undefined,
): string | null {
  if (profile?.avatar_url) return profile.avatar_url;
  const legacy = authUser?.user_metadata?.avatar_url;
  if (typeof legacy !== "string" || !legacy) return null;
  if (legacy.startsWith("data:")) return null; // refuse the bloated form
  return legacy;
}
