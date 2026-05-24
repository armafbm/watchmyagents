export const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function getSafeAuthRedirect(value: unknown, fallback = DEFAULT_AUTH_REDIRECT) {
  if (typeof value !== "string") return fallback;

  const target = value.trim();
  if (!target || !target.startsWith("/") || target.startsWith("//")) return fallback;

  try {
    const url = new URL(target, "https://watchmyagents.local");
    if (url.origin !== "https://watchmyagents.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return fallback;
  }
}