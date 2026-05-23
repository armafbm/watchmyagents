import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Recovery mode (when user clicks email link with type=recovery in URL hash)
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    setCooldown(30);
  };

  const updatePw = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated — redirecting…");
    setTimeout(() => (window.location.href = "/auth/signin"), 1500);
  };

  if (isRecovery) {
    return (
      <AuthLayout
        title="Set a new password"
        subtitle="Choose a strong password for your account."
      >
        <form onSubmit={updatePw} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newpw" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
              New password
            </Label>
            <Input
              id="newpw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmpw" className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
              Confirm password
            </Label>
            <Input
              id="confirmpw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Reset password
          </Button>
        </form>
      </AuthLayout>
    );
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        footer={
          <Link to="/auth/signin" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <MailCheck className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to{" "}
            <span className="text-foreground font-mono">{email}</span>.
          </p>
          <p className="text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder.
          </p>
          <Button
            variant="outline"
            disabled={cooldown > 0}
            onClick={() => {
              setSent(false);
            }}
            className="mt-2"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Send again"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email — we'll send a recovery link."
      footer={
        <Link to="/auth/signin" className="text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={send} className="space-y-4">
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
        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send recovery link
        </Button>
      </form>
    </AuthLayout>
  );
}
