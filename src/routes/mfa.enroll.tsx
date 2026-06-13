import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mfa/enroll")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth/signin" });
    // Already enrolled and at AAL2 — go to dashboard
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") throw redirect({ to: "/dashboard" });
    // Has a factor but not yet challenged — go to challenge
    if (aal?.nextLevel === "aal2") throw redirect({ to: "/mfa/challenge" });
  },
  head: () => ({
    meta: [
      { title: "Set up two-factor authentication — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MfaEnrollPage,
});

function MfaEnrollPage() {
  const [step, setStep] = useState<"start" | "confirming">("start");
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const startEnroll = async () => {
    setBusy(true);
    const FRIENDLY_NAME = "Authenticator app";

    let { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: FRIENDLY_NAME,
    });

    // "already exists" → find and delete the conflicting factor, then retry once
    if (error?.message?.toLowerCase().includes("already exists")) {
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const conflict = (existing?.totp ?? []).find((f: any) => f.friendly_name === FRIENDLY_NAME);
      if (conflict) await supabase.auth.mfa.unenroll({ factorId: conflict.id });
      ({ data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: FRIENDLY_NAME,
      }));
    }

    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setEnrollData({ factorId: data!.id, qr: data!.totp.qr_code, secret: data!.totp.secret });
    setStep("confirming");
  };

  const confirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;
    setBusy(true);
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: enrollData.factorId,
    });
    if (chErr) {
      toast.error(chErr.message);
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollData.factorId,
      challengeId: challenge.id,
      code: code.replace(/\s/g, ""),
    });
    setBusy(false);
    if (error) {
      toast.error("Invalid code — try again.");
      setCode("");
      return;
    }
    // Session is now AAL2 — proceed to dashboard
    window.location.assign("/dashboard");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/auth/signin");
  };

  return (
    <AuthLayout
      title="Secure your account"
      subtitle="Two-factor authentication is required to access Fortress."
    >
      {step === "start" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scan the QR code with Google Authenticator, Authy, 1Password, or any TOTP app.
            You'll need a 6-digit code at every sign-in.
          </p>
          <Button onClick={startEnroll} disabled={busy} className="w-full">
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <QrCode className="w-4 h-4 mr-2" />
            )}
            Set up authenticator app
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Wrong account?{" "}
            <button
              type="button"
              onClick={signOut}
              className="text-primary hover:underline"
            >
              Sign out
            </button>
          </p>
        </div>
      )}

      {step === "confirming" && enrollData && (
        <div className="space-y-5">
          <img
            src={enrollData.qr}
            alt="TOTP QR code"
            className="mx-auto w-48 h-48 rounded-xl border border-border bg-white p-2"
          />
          <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Manual entry
            </p>
            <code className="font-mono text-xs tracking-widest break-all">
              {enrollData.secret}
            </code>
          </div>
          <form onSubmit={confirmEnroll} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                Verification code
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
              disabled={busy || code.replace(/\s/g, "").length < 6}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              Activate
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Wrong account?{" "}
            <button type="button" onClick={signOut} className="text-primary hover:underline">
              Sign out
            </button>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
