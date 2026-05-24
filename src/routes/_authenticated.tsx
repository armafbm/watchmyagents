import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";

const RESTORE_ATTEMPTS = 20;
const RESTORE_DELAY_MS = 100;

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isSessionValid(session: { access_token: string; expires_at?: number } | null) {
  if (!session?.access_token) return false;
  if (!session.expires_at) return true;
  // expires_at is unix seconds; add 30s buffer
  return session.expires_at * 1000 > Date.now() + 30_000;
}

async function hasPersistedSession() {
  // First pass: check synchronously what we already have
  const { data } = await supabase.auth.getSession();
  if (isSessionValid(data.session)) return true;

  // If storage isn't hydrated yet (first paint after OAuth), poll briefly
  for (let i = 0; i < RESTORE_ATTEMPTS; i++) {
    await wait(RESTORE_DELAY_MS);
    const { data: again } = await supabase.auth.getSession();
    if (isSessionValid(again.session)) return true;
  }
  return false;
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;

    // Trust the locally persisted session — Supabase auto-refreshes the token
    // in the background. We do NOT call getUser() here: that re-hits the
    // network on every navigation and a single hiccup bounces the user back
    // to /auth/signin. RLS on the server is the real backstop.
    const ok = await hasPersistedSession();
    if (!ok) {
      throw redirect({
        to: "/auth/signin",
        search: { redirect: getSafeAuthRedirect(location.href) },
      });
    }
  },
  component: () => <Outlet />,
});
