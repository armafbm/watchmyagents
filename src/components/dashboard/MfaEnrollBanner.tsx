import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MfaEnrollModal } from "@/components/dashboard/MfaEnrollModal";

export function MfaEnrollBanner() {
  const [show, setShow] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const hasVerified = (data?.totp ?? []).some((f: any) => f.status === "verified");
      if (!hasVerified) setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <>
      <div className="mx-6 mt-4 mb-0 rounded-xl border border-warning/40 bg-warning/[0.07] px-4 py-3 flex items-center gap-3">
        <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
        <p className="text-sm flex-1">
          <span className="font-semibold text-warning">
            Two-factor authentication is required.
          </span>{" "}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="underline underline-offset-2 text-warning hover:text-warning/80"
          >
            Set up 2FA now
          </button>{" "}
          to keep your account secure.
        </p>
      </div>

      {modalOpen && (
        <MfaEnrollModal
          onClose={() => setModalOpen(false)}
          onEnrolled={() => { setModalOpen(false); setShow(false); }}
        />
      )}
    </>
  );
}
