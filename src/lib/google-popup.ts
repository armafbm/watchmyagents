// Full-page Google OAuth redirect (popup-free, no race conditions).
// We persist the post-login destination in sessionStorage so /auth/callback
// can route the user back where they came from after Google returns.

import { lovable } from "@/integrations/lovable/index";

export const AUTH_REDIRECT_KEY = "wma:postLoginRedirect";

export async function startGoogleSignIn(postLoginRedirect: string = "/dashboard") {
  try {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, postLoginRedirect);
  } catch {
    // ignore — non-blocking
  }

  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}/auth/callback`,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Google sign-in failed");
  }
  // If `redirected` the browser is already navigating away — nothing else to do.
  // Otherwise (rare: tokens returned inline) the callback page will pick up
  // the session via onAuthStateChange.
  return result;
}
