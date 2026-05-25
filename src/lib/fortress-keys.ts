export async function generateApiKey() {
  const key = "wma_" + crypto.randomUUID().replace(/-/g, "");
  const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  const hash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { key, hash, prefix: key.slice(0, 12) };
}
