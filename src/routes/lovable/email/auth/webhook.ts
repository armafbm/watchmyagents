import * as React from "react";
import { render } from "@react-email/components";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { SignupEmail } from "@/lib/email-templates/signup";
import { InviteEmail } from "@/lib/email-templates/invite";
import { MagicLinkEmail } from "@/lib/email-templates/magic-link";
import { RecoveryEmail } from "@/lib/email-templates/recovery";
import { EmailChangeEmail } from "@/lib/email-templates/email-change";
import { ReauthenticationEmail } from "@/lib/email-templates/reauthentication";

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: "Confirm your email",
  invite: "You've been invited",
  magiclink: "Your login link",
  recovery: "Reset your password",
  email_change: "Confirm your new email",
  reauthentication: "Your verification code",
};

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
};

const SITE_NAME = "watchmyagents";
const FROM_ADDRESS = "WatchMyAgents <notify@watchmyagents.com>";
const ROOT_DOMAIN = "watchmyagents.com";

function redactEmail(email: string | null | undefined): string {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}

// Verify Supabase Auth Hook HMAC-SHA256 signature.
async function verifySupabaseHookSignature(request: Request, secret: string): Promise<string> {
  const signature = request.headers.get("x-supabase-signature");
  if (!signature) throw new Error("Missing x-supabase-signature header");

  const body = await request.text();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(body));
  if (!valid) throw new Error("Invalid signature");
  return body;
}

export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
          console.error("Missing required environment variables");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Parse body (with optional signature verification if hook secret is configured)
        let body: string;
        try {
          if (hookSecret) {
            body = await verifySupabaseHookSignature(request, hookSecret);
          } else {
            body = await request.text();
          }
        } catch (error) {
          console.error("Webhook verification failed", { error });
          return Response.json({ error: "Invalid signature" }, { status: 401 });
        }

        let data: any;
        try {
          data = JSON.parse(body);
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        // Support both Supabase Auth Hook format and legacy format
        const emailType = data?.email_data?.email_action_type ?? data?.data?.action_type;
        const recipientEmail = data?.user?.email ?? data?.data?.email;
        const confirmationUrl = data?.email_data?.confirmation_url ?? data?.data?.url;
        const token = data?.email_data?.otp ?? data?.data?.token;

        if (!emailType || !recipientEmail) {
          console.error("Missing emailType or recipient", { emailType, recipient: redactEmail(recipientEmail) });
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }

        const EmailTemplate = EMAIL_TEMPLATES[emailType];
        if (!EmailTemplate) {
          console.error("Unknown email type", { emailType });
          return Response.json({ error: `Unknown email type: ${emailType}` }, { status: 400 });
        }

        const templateProps = {
          siteName: SITE_NAME,
          siteUrl: `https://${ROOT_DOMAIN}`,
          recipient: recipientEmail,
          confirmationUrl,
          token,
          email: recipientEmail,
          oldEmail: data?.email_data?.old_email ?? data?.data?.old_email,
          newEmail: data?.email_data?.new_email ?? data?.data?.new_email,
        };

        const element = React.createElement(EmailTemplate, templateProps);
        const html = await render(element);
        const text = await render(element, { plainText: true });

        // Send directly via Resend (auth emails are time-sensitive — skip queue)
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_ADDRESS,
            to: [recipientEmail],
            subject: EMAIL_SUBJECTS[emailType] ?? "Notification",
            html,
            text,
          }),
        });

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const messageId = crypto.randomUUID();

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Resend send failed", { status: res.status, emailType, error: errorText });
          await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: recipientEmail,
            status: "failed",
            error_message: `Resend ${res.status}: ${errorText}`.slice(0, 1000),
          });
          return Response.json({ error: "Failed to send email" }, { status: 500 });
        }

        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: emailType,
          recipient_email: recipientEmail,
          status: "sent",
        });

        console.log("Auth email sent via Resend", { emailType, email_redacted: redactEmail(recipientEmail) });
        return Response.json({ success: true });
      },
    },
  },
});
