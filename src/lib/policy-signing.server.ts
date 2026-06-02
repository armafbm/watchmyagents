// Server-only Ed25519 helpers + canonical JSON serialization for the
// Fortress policy signing chain-of-trust. Must match the SDK byte-for-byte.

import {
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
} from "node:crypto";

// ---------- canonical JSON (JCS-lite) ----------

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((v) => canonicalize(v)).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k]))
      .join(",") +
    "}"
  );
}

// ---------- payload shapes ----------

export type PolicySignableFields = {
  rule_id?: unknown;
  match?: unknown;
  action?: unknown;
  message?: unknown;
  priority?: unknown;
  mode?: unknown;
};

const POLICY_FIELDS = [
  "rule_id",
  "match",
  "action",
  "message",
  "priority",
  "mode",
] as const;

export function policySigningPayload(p: PolicySignableFields): string {
  const out: Record<string, unknown> = {};
  for (const f of POLICY_FIELDS) {
    const v = (p as Record<string, unknown>)[f];
    out[f] = v === undefined ? null : v;
  }
  return canonicalize(out);
}

export type SigningKeySignableFields = {
  kid: string;
  pubkey: string;
  valid_from: string;
  valid_until: string;
};

export function signingKeyPayload(k: SigningKeySignableFields): string {
  return canonicalize({
    kid: k.kid,
    pubkey: k.pubkey,
    valid_from: k.valid_from,
    valid_until: k.valid_until,
  });
}

// ---------- Ed25519 primitives ----------

// SPKI DER prefix for an Ed25519 raw 32-byte public key.
const ED25519_SPKI_PREFIX = Buffer.from([
  0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
]);

export function rawPubkeyToKeyObject(rawBase64: string) {
  const raw = Buffer.from(rawBase64, "base64");
  if (raw.length !== 32) {
    throw new Error(
      `Invalid Ed25519 public key length: expected 32 raw bytes, got ${raw.length}`,
    );
  }
  const spki = Buffer.concat([ED25519_SPKI_PREFIX, raw]);
  return createPublicKey({ key: spki, format: "der", type: "spki" });
}

export function signEd25519(privateKeyPem: string, payload: string): string {
  const key = createPrivateKey(privateKeyPem);
  const sig = cryptoSign(null, Buffer.from(payload, "utf8"), key);
  return sig.toString("base64");
}

export function verifyEd25519(
  rawPubkeyBase64: string,
  payload: string,
  sigBase64: string,
): boolean {
  try {
    const key = rawPubkeyToKeyObject(rawPubkeyBase64);
    return cryptoVerify(
      null,
      Buffer.from(payload, "utf8"),
      key,
      Buffer.from(sigBase64, "base64"),
    );
  } catch {
    return false;
  }
}
