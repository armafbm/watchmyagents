import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "mfa_banner_dismissed";

export function MfaEnrollBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const hasVerified = (data?.totp ?? []).some((f: any) => f.status === "verified");
      if (!hasVerified) setShow(true);
    });
  }, []);

  if (!show) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="mx-6 mt-4 mb-0 rounded-xl border border-warning/40 bg-warning/[0.07] px-4 py-3 flex items-center gap-3">
      <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-semibold text-warning">Your account has no two-factor authentication.</span>{" "}
        <Link
          to="/dashboard/settings/profile"
          className="underline underline-offset-2 text-warning hover:text-warning/80"
          onClick={dismiss}
        >
          Set up 2FA now
        </Link>{" "}
        to secure your access.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground p-1 rounded"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
