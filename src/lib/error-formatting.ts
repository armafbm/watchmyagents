/**
 * Shared error formatting helpers.
 *
 * Centralizes the patterns we use to turn raw thrown errors (from
 * network fetches, server functions, Supabase calls, etc.) into
 * user-facing messages. Keep this file free of side-effects so it
 * can be imported by both server and client code.
 */

const FETCH_PROXY_RE = /Failed to fetch|NetworkError|TypeError: fetch/i;

/**
 * Normalize an unknown thrown value into a short, user-displayable
 * message plus a structured `isFetchProxy` flag that callers can use
 * to surface a connectivity hint (e.g. "try the published URL").
 *
 * The message is truncated to 200 chars so a verbose backend stack
 * trace doesn't overflow a tight UI slot.
 */
export function humanizeError(err: unknown): { message: string; isFetchProxy: boolean } {
  const raw = err instanceof Error ? err.message : String(err);
  const isFetchProxy = FETCH_PROXY_RE.test(raw);
  return {
    message: isFetchProxy
      ? "Connection issue while loading your fortress."
      : raw.replace(/^Error:\s*/, "").slice(0, 200),
    isFetchProxy,
  };
}
