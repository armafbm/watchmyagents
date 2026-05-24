import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { startGoogleSignIn } from "@/lib/google-popup";
import { AuthLayout, Divider, GoogleButton } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — WatchMyAgents" },
      { name: "description", content: "Create your WatchMyAgents account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  fullName: z.string().trim().min(1, "Required").max(100),
  company: z.string().trim().max(120).optional(),
});

function passwordChecks(p: string) {
  return {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p),
  };
}

function strengthScore(p: string) {
  const c = passwordChecks(p);
  return [c.length, c.upper, c.number, c.special].filter(Boolean).length;
}

const STRENGTH = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["bg-muted", "bg-destructive", "bg-warning", "bg-cyan", "bg-success"];

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const checks = passwordChecks(password);
  const score = strengthScore(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName, company });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (score < 3) {
      toast.error("Choose a stronger password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.fullName,
          company: parsed.data.company ?? "",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — check your email to verify.");
    navigate({ to: "/auth/signin" });
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    try {
      await startGoogleSignIn("/dashboard");
      // Browser is navigating to Google — keep the spinner on.
    } catch (err) {
      setOauthLoading(false);
      toast.error(err instanceof Error ? err.message : "Google sign-up failed");
    }
  };

  return (
    <AuthLayout
      title="Create your WatchMyAgents account"
      subtitle="Start protecting your AI agents in production."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton onClick={handleGoogle} loading={oauthLoading} label="Sign up with Google" />

      <Divider>Or continue with email</Divider>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Full name
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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

          {password.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= score ? STRENGTH_COLOR[score] : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              {score > 0 && (
                <p className="text-xs font-mono text-muted-foreground">
                  Strength: <span className="text-foreground">{STRENGTH[score]}</span>
                </p>
              )}
              <ul className="text-xs space-y-1 text-muted-foreground">
                <Req ok={checks.length}>At least 8 characters</Req>
                <Req ok={checks.upper}>Contains uppercase letter</Req>
                <Req ok={checks.number}>Contains number</Req>
                <Req ok={checks.special}>Contains special character (!@#$%^&*)</Req>
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="company" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Company <span className="text-muted-foreground/60 normal-case">(optional)</span>
          </Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
            autoComplete="organization"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create account
        </Button>

        <p className="text-xs text-muted-foreground text-center pt-2">
          By signing up, you agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground">Terms</a> and{" "}
          <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </form>
    </AuthLayout>
  );
}

function Req({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-success" : ""}`}>
      {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />}
      {children}
    </li>
  );
}
