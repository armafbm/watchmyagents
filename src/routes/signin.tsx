import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, GoogleButton } from "@/components/auth/AuthLayout";
import { startGoogleSignIn } from "@/lib/google-popup";

export const Route = createFileRoute("/signin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/post-login" });
  },
  head: () => ({ meta: [{ title: "Sign in — Fortress" }, { name: "robots", content: "noindex" }] }),
  component: SignInPage,
});

function SignInPage() {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    setLoading(true);
    try {
      await startGoogleSignIn("/post-login");
    } catch (e) {
      setLoading(false);
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
    }
  };
  return (
    <AuthLayout
      title="Sign in to Fortress"
      subtitle="Protect your AI agents in seconds."
      footer={<span>Google identity only — no passwords to remember.</span>}
    >
      <GoogleButton onClick={onClick} loading={loading} label="Sign in with Google" />
      {loading && (
        <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin mr-2" /> Redirecting…
        </div>
      )}
    </AuthLayout>
  );
}
