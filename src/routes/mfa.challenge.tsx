import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mfa/challenge")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth/signin" });
    // Already at AAL2 — nothing to do
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Two-factor verification — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MfaChallengePage,
});

function MfaChallengePage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp?.[0];
      if (totp) setFactorId(totp.id);
    });
  }, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);

    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) {
      toast.error(chErr.message);
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.replace(/\s/g, ""),
    });

    setBusy(false);
    if (error) {
      toast.error("Invalid code — try again.");
      setCode("");
      return;
    }

    // Hard navigate so the auth context re-initialises with the AAL2 session
    window.location.assign("/dashboard");
  };

  return (
    <AuthLayout
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app."
    >
      <form onSubmit={verify} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Authentication code
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]*"
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000 000"
            autoComplete="one-time-code"
            autoFocus
            className="text-center tracking-[0.3em] text-xl font-mono"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={busy || code.replace(/\s/g, "").length < 6 || !factorId}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          Verify
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Lost access to your authenticator?{" "}
        <a
          href="mailto:support@watchmyagents.com"
          className="text-primary hover:underline"
        >
          Contact support
        </a>
      </p>
    </AuthLayout>
  );
}
