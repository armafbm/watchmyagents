import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    let cancelled = false;

    const waitForSession = async () => {
      // Poll briefly for session to be hydrated by the OAuth broker / Supabase storage
      for (let i = 0; i < 30; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (!cancelled) navigate({ to: "/dashboard", replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) navigate({ to: "/auth/signin", replace: true });
    };

    waitForSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="font-mono text-sm uppercase tracking-wider">Finalizing sign-in…</span>
      </div>
    </div>
  );
}
