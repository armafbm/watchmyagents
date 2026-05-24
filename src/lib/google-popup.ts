// Opens Google OAuth inside a centered popup window (same tab stays put).
// Resolves once the popup writes the Supabase session to shared localStorage
// and posts a success message back. Rejects on error or popup-blocked.

export type GooglePopupResult = "success" | "closed";

export function openGooglePopup(): Promise<GooglePopupResult> {
  return new Promise((resolve, reject) => {
    const w = 480;
    const h = 680;
    const left = Math.max(0, window.screenX + (window.outerWidth - w) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - h) / 2);

    const popup = window.open(
      `${window.location.origin}/auth/google-popup`,
      "wma-google-auth",
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`,
    );

    if (!popup) {
      reject(new Error("Popup blocked. Please allow popups for this site."));
      return;
    }

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(closedPoll);
    };

    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const data = ev.data as { type?: string; message?: string } | undefined;
      if (!data?.type) return;
      if (data.type === "WMA_AUTH_SUCCESS") {
        cleanup();
        resolve("success");
      } else if (data.type === "WMA_AUTH_ERROR") {
        cleanup();
        reject(new Error(data.message ?? "Google sign-in failed"));
      }
    };

    const closedPoll = setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve("closed");
      }
    }, 400);

    window.addEventListener("message", onMessage);
  });
}
