import { useState } from "react";
import { Loader2, X, QrCode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  onClose: () => void;
  onEnrolled: () => void;
};

export function MfaEnrollModal({ onClose, onEnrolled }: Props) {
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
    if (chErr) { toast.error(chErr.message); setBusy(false); return; }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollData.factorId,
      challengeId: challenge.id,
      code: code.replace(/\s/g, ""),
    });
    setBusy(false);
    if (error) { toast.error("Invalid code — try again."); setCode(""); return; }
    toast.success("Two-factor authentication enabled.");
    onEnrolled();
  };

  const cancel = () => {
    if (enrollData) {
      supabase.auth.mfa.unenroll({ factorId: enrollData.factorId }).catch(() => undefined);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-0.5">
              Security · MFA
            </div>
            <div className="font-semibold text-sm">Set up two-factor authentication</div>
          </div>
          <button
            type="button"
            onClick={cancel}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {step === "start" && (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Protect your account with an authenticator app (Google Authenticator, Authy,
                1Password…). You'll need a 6-digit code at every sign-in.
              </p>
              <Button onClick={startEnroll} disabled={busy} className="w-full">
                {busy
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <QrCode className="h-4 w-4 mr-2" />}
                Generate QR code
              </Button>
            </>
          )}

          {step === "confirming" && enrollData && (
            <>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Scan with your authenticator app, then enter the 6-digit code below.
              </p>

              <img
                src={enrollData.qr}
                alt="TOTP QR code"
                className="mx-auto w-48 h-48 rounded-xl bg-white p-2"
              />

              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
                  Can't scan? Enter the key manually
                </summary>
                <code className="block mt-2 font-mono text-[10px] break-all bg-muted/40 px-2 py-1.5 rounded border border-border/40">
                  {enrollData.secret}
                </code>
              </details>

              <form onSubmit={confirmEnroll} className="space-y-4 border-t border-border/40 pt-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Confirmation code
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
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={cancel} disabled={busy} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={busy || code.replace(/\s/g, "").length < 6}
                    className="flex-1"
                  >
                    {busy
                      ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      : <ShieldCheck className="h-4 w-4 mr-2" />}
                    Activate
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
