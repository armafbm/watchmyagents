import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const AUTH_RESTORE_ATTEMPTS = 12;
const AUTH_RESTORE_DELAY_MS = 150;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getRestoredUser() {
  for (let i = 0; i < AUTH_RESTORE_ATTEMPTS; i++) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      await wait(AUTH_RESTORE_DELAY_MS);
      continue;
    }

    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) return data.user;
    await wait(AUTH_RESTORE_DELAY_MS);
  }

  return null;
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;

    const user = await getRestoredUser();
    if (!user) {
      throw redirect({
        to: "/auth/signin",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
});
