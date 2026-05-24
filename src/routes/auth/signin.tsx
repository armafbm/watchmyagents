import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, Divider, GoogleButton } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";
import { openGooglePopup } from "@/lib/google-popup";

export const Route = createFileRoute("/auth/signin")({
  validateSearch: (search) => ({
    redirect: getSafeAuthRedirect(search.redirect),
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;

    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ href: search.redirect, replace: true });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — WatchMyAgents" },
      { name: "description", content: "Sign in to your WatchMyAgents account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SigninPage,
});

function SigninPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ href: search.redirect, replace: true });
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (res.error) {
      setOauthLoading(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (!res.redirected) {
      navigate({ href: search.redirect, replace: true });
    }
    // If redirected, browser is navigating to Google — nothing more to do.
  };

  return (
    <AuthLayout
      title="Sign in to WatchMyAgents"
      subtitle="Continue protecting your AI agents."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/auth/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <GoogleButton onClick={handleGoogle} loading={oauthLoading} label="Continue with Google" />

      <Divider>Or continue with email</Divider>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
              Password
            </Label>
            <Link
              to="/auth/reset-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
          />
          Remember this device
        </label>

        <Button type="submit" className="w-full" disabled={loading || !email || !password}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
