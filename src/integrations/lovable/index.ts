// MIGRATED 2026-06-06: this file used to wrap @lovable.dev/cloud-auth-js
// to gate OAuth through Lovable's hosted gateway. We migrated to direct
// Supabase auth because the Lovable proxy was an unnecessary single point
// of failure — lost-credit / paused-account scenarios kill OAuth sign-in
// even though Supabase itself is up. The public API surface
// (`lovable.auth.signInWithOAuth`) is preserved verbatim so all callers
// (src/lib/google-popup.ts, src/routes/auth/google-popup.tsx, etc.)
// continue to work without changes.

import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

type SignInResult = {
  redirected?: boolean;
  error?: Error;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple" | "microsoft" | "lovable",
      opts?: SignInOptions,
    ): Promise<SignInResult> => {
      // "lovable" was Lovable-only and never reached Supabase OAuth
      // providers; map it to "google" so old callers degrade gracefully.
      const mappedProvider = provider === "lovable" ? "google" : provider;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: mappedProvider,
        options: {
          redirectTo: opts?.redirect_uri,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
      }

      // Supabase returns { data: { url }, error } — we navigate ourselves.
      // The old Lovable wrapper navigated internally and signalled
      // `{ redirected: true }` to the caller, preserve that contract so
      // /signin and /auth/google-popup keep working as-is.
      if (data?.url && typeof window !== "undefined") {
        window.location.assign(data.url);
        return { redirected: true };
      }

      return { error: new Error("OAuth start failed: no redirect URL returned by Supabase") };
    },
  },
};
