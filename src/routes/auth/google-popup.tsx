import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth/google-popup")({
  head: () => ({
    meta: [
      { title: "Connecting Google…" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GooglePopup,
});

const MSG_SUCCESS = "WMA_AUTH_SUCCESS";
const MSG_ERROR = "WMA_AUTH_ERROR";

function GooglePopup() {
  const [status, setStatus] = useState("Connecting to Google…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await lovable.auth.signInWithOAuth("google", {
          // Stay inside the popup window for the entire OAuth dance.
          redirect_uri: `${window.location.origin}/auth/google-popup`,
        });
        if (cancelled) return;

        if (res.error) {
          window.opener?.postMessage(
            { type: MSG_ERROR, message: "Google sign-in failed" },
            window.location.origin,
          );
          window.close();
          return;
        }

        if (res.redirected) {
          // The popup is now navigating to Google. Nothing else to do here —
          // when it returns to /auth/google-popup, this component remounts
          // and the call resolves with tokens.
          setStatus("Redirecting to Google…");
          return;
        }

        // Tokens received & session is set in localStorage (shared with opener).
        setStatus("Signed in. Returning to Fortress…");
        window.opener?.postMessage(
          { type: MSG_SUCCESS },
          window.location.origin,
        );
        // Small delay so the success state is visible if the window is slow to close.
        setTimeout(() => window.close(), 80);
      } catch (e) {
        if (cancelled) return;
        window.opener?.postMessage(
          { type: MSG_ERROR, message: e instanceof Error ? e.message : "Unknown error" },
          window.location.origin,
        );
        window.close();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-6">
      <div className="flex flex-col items-center gap-3 text-muted-foreground font-mono text-xs uppercase tracking-widest">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        {status}
      </div>
    </div>
  );
}
