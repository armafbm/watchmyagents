// Thin wrappers over Supabase Vault for storing/reading signing-key
// private material. Server-only.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Store a secret in Vault. Returns the stable secret name (we use the
 *  caller-supplied name as the ref). */
export async function storeVaultSecret(
  name: string,
  value: string,
  description?: string,
): Promise<string> {
  // vault.create_secret(secret text, name text, description text)
  const { error } = await supabaseAdmin.rpc("create_secret" as never, {
    new_secret: value,
    new_name: name,
    new_description: description ?? "",
  } as never);
  if (error) {
    // Fallback: write directly via vault schema if RPC isn't exposed.
    throw new Error(`Vault store failed: ${error.message}`);
  }
  return name;
}

/** Read a decrypted secret from Vault by name. */
export async function readVaultSecret(name: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .schema("vault" as never)
    .from("decrypted_secrets" as never)
    .select("decrypted_secret")
    .eq("name", name)
    .maybeSingle();
  if (error) throw new Error(`Vault read failed: ${error.message}`);
  if (!data) throw new Error(`Vault secret not found: ${name}`);
  return (data as { decrypted_secret: string }).decrypted_secret;
}
