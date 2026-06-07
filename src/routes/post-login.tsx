import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/post-login")({
  head: () => ({ meta: [{ title: "Loading… — Fortress" }, { name: "robots", content: "noindex" }] }),
  component: PostLogin,
});

function PostLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wait for session hydration (in case we just came back from OAuth)
      for (let i = 0; i < 30; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        if (!cancelled) navigate({ to: "/auth/signin", replace: true });
        return;
      }
      const { count } = await supabase
        .from("agents")
        .select("id", { count: "exact", head: true });
      if (cancelled) return;
      if ((count ?? 0) === 0) navigate({ to: "/onboarding", replace: true });
      else navigate({ to: "/dashboard", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest">Loading your fortress…</span>
      </div>
    </div>
  );
}
