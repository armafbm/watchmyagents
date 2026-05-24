import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_REDIRECT_KEY } from "@/lib/google-popup";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing in…" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Finalizing sign-in…");

  useEffect(() => {
    let cancelled = false;
    let done = false;

    const dest = (() => {
      try {
        const raw = sessionStorage.getItem(AUTH_REDIRECT_KEY);
        sessionStorage.removeItem(AUTH_REDIRECT_KEY);
        return getSafeAuthRedirect(raw);
      } catch {
        return "/dashboard";
      }
    })();

    const goSuccess = () => {
      if (done || cancelled) return;
      done = true;
      navigate({ href: dest, replace: true });
    };

    const goFail = () => {
      if (done || cancelled) return;
      done = true;
      navigate({
        to: "/auth/signin",
        search: { redirect: dest },
        replace: true,
      });
    };

    // 1) Listen for the SIGNED_IN event — fires the instant Supabase
    //    hydrates the session from the URL hash / storage.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) goSuccess();
      },
    );

    // 2) Also check immediately in case the session is already there
    //    (warm cache, second mount, etc.).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goSuccess();
    });

    // 3) Hard timeout — if nothing happens within 8s, bounce to signin.
    const timeout = window.setTimeout(() => {
      setStatus("Still working…");
      // give one last shot
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) goSuccess();
        else goFail();
      });
    }, 8000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="font-mono text-sm uppercase tracking-wider">{status}</span>
      </div>
    </div>
  );
}
