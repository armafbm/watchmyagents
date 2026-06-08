// Server-Sent Events stream of policy changes for a single agent.
// Auth: Bearer wma_<32hex> (same as ingest-signals).
// GET /functions/v1/policies-stream?agent_id=<native_agent_id>
import { createClient, type RealtimeChannel } from "https://esm.sh/@supabase/supabase-js@2.45.0";

async function sha256Hex(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SSE_HEADERS: HeadersInit = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
  "x-accel-buffering": "no",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, accept",
};

function textErr(status: number, msg: string) {
  return new Response(msg, {
    status,
    headers: { "content-type": "text/plain", "access-control-allow-origin": "*" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "authorization, content-type, accept",
      },
    });
  }
  if (req.method !== "GET") return textErr(405, "method not allowed");

  const url = new URL(req.url);
  const agentIdParam = url.searchParams.get("agent_id");
  if (!agentIdParam || agentIdParam.length > 256) return textErr(400, "agent_id required");

  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(wma_[a-f0-9]{32})\s*$/i);
  if (!match) return textErr(401, "missing or malformed Authorization header");
  const apiKey = match[1];
  const apiKeyHash = await sha256Hex(apiKey);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("id, customer_id, revoked_at")
    .eq("hash", apiKeyHash)
    .maybeSingle();
  if (!keyRow || keyRow.revoked_at) return textErr(403, "forbidden");

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("customer_id", keyRow.customer_id)
    .eq("native_agent_id", agentIdParam)
    .maybeSingle();
  if (!agent) return textErr(404, "agent not found");

  // fire-and-forget last_used bump
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => {});

  const encoder = new TextEncoder();
  let channel: RealtimeChannel | null = null;
  let heartbeat: number | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* closed */
        }
      };

      safeEnqueue(`: connected agent=${agent.id}\n\n`);
      safeEnqueue(`retry: 5000\n\n`);

      heartbeat = setInterval(() => safeEnqueue(`: keepalive ${Date.now()}\n\n`), 30_000);

      channel = supabase
        .channel(`policies:${agent.id}`)
        .on(
          // @ts-expect-error - realtime types are missing the 'postgres_changes' channel overload
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "policies",
            filter: `agent_id=eq.${agent.id}`,
          },
          (payload: {
            eventType: "INSERT" | "UPDATE" | "DELETE";
            new: Record<string, unknown> | null;
            old: Record<string, unknown> | null;
          }) => {
            const row = payload.new ?? payload.old ?? {};
            const evt = {
              rule_id: (row as { rule_id?: string }).rule_id ?? null,
              action: (row as { action?: string }).action ?? null,
              ts: new Date().toISOString(),
              kind:
                payload.eventType === "INSERT"
                  ? "inserted"
                  : payload.eventType === "UPDATE"
                    ? "updated"
                    : "deleted",
            };
            safeEnqueue(`event: policy_changed\ndata: ${JSON.stringify(evt)}\n\n`);
          },
        )
        .subscribe((status) => {
          safeEnqueue(`: subscribe ${status}\n\n`);
        });

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeat !== undefined) clearInterval(heartbeat);
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch {
            /* noop */
          }
        }
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
      if (heartbeat !== undefined) clearInterval(heartbeat);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* noop */
        }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
});
