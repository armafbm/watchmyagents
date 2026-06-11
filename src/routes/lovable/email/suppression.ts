import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

// Resend webhook event types for deliverability signals
type ResendEventType = "email.bounced" | "email.complained" | "email.delivery_delayed";

interface ResendWebhookPayload {
  type: ResendEventType;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
  };
}

function mapEventToReason(type: ResendEventType): "bounce" | "complaint" | "unsubscribe" {
  if (type === "email.bounced") return "bounce";
  if (type === "email.complained") return "complaint";
  return "unsubscribe";
}

function mapReasonToStatus(reason: string): "bounced" | "complained" | "suppressed" {
  if (reason === "bounce") return "bounced";
  if (reason === "complaint") return "complained";
  return "suppressed";
}

function mapReasonToMessage(reason: string): string {
  if (reason === "bounce") return "Permanent bounce — email address is invalid or rejected";
  if (reason === "complaint") return "Spam complaint — recipient marked email as spam";
  return "Email suppressed";
}

// Verify Resend webhook signature (Svix-based).
async function verifyResendSignature(request: Request, secret: string): Promise<string> {
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing Svix signature headers");
  }

  const body = await request.text();
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;

  // Svix secret is prefixed with "whsec_" — strip it for raw bytes
  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Uint8Array.from(atob(rawSecret), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const computed = `v1,${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;

  // svix-signature may contain multiple signatures (space-separated)
  const valid = svixSignature.split(" ").some((s) => s === computed);
  if (!valid) throw new Error("Invalid Svix signature");

  return body;
}

export const Route = createFileRoute("/lovable/email/suppression")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
          console.error("Missing required environment variables");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        let body: string;
        try {
          if (webhookSecret) {
            body = await verifyResendSignature(request, webhookSecret);
          } else {
            body = await request.text();
          }
        } catch (error) {
          console.error("Webhook signature verification failed", { error });
          return Response.json({ error: "Invalid signature" }, { status: 401 });
        }

        let event: ResendWebhookPayload;
        try {
          event = JSON.parse(body);
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!["email.bounced", "email.complained"].includes(event.type)) {
          // Acknowledge other event types without processing
          return Response.json({ received: true });
        }

        const recipientEmail = event.data?.to?.[0];
        if (!recipientEmail) {
          return Response.json({ error: "Missing recipient" }, { status: 400 });
        }

        const reason = mapEventToReason(event.type);
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const normalizedEmail = recipientEmail.toLowerCase();

        const { error: suppressError } = await supabase.from("suppressed_emails").upsert(
          { email: normalizedEmail, reason },
          { onConflict: "email" }
        );

        if (suppressError) {
          console.error("Failed to upsert suppressed email", { error: suppressError });
          return Response.json({ error: "Failed to write suppression" }, { status: 500 });
        }

        await supabase.from("email_send_log").insert({
          message_id: event.data.email_id ?? null,
          template_name: "system",
          recipient_email: normalizedEmail,
          status: mapReasonToStatus(reason),
          error_message: mapReasonToMessage(reason),
        });

        console.log("Suppression processed", {
          email_redacted: normalizedEmail[0] + "***@" + normalizedEmail.split("@")[1],
          type: event.type,
        });

        return Response.json({ success: true });
      },
    },
  },
});
