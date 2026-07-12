/**
 * AES-256-GCM encryption for org integration secrets at rest.
 * Key derived from AUTH_SECRET (or fallbacks for local dev only).
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const IV_BYTES = 12;
const PREFIX = "edsec1:";

function getSecretsKey() {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "estatedesk-local-secrets-key";
  return createHash("sha256").update(`secrets\0${secret}`).digest();
}

export function encryptSecret(plaintext: string | null | undefined): string | null {
  if (!plaintext?.trim()) return null;
  const key = getSecretsKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext.trim(), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64url");
  return `${PREFIX}${payload}`;
}

export function decryptSecret(ciphertext: string | null | undefined): string | null {
  if (!ciphertext?.trim()) return null;
  if (!ciphertext.startsWith(PREFIX)) {
    // Legacy plaintext (dev only) — return as-is so ops can re-save encrypted.
    return ciphertext;
  }
  try {
    const raw = Buffer.from(ciphertext.slice(PREFIX.length), "base64url");
    if (raw.length <= IV_BYTES + 16) return null;
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + 16);
    const data = raw.subarray(IV_BYTES + 16);
    const decipher = createDecipheriv("aes-256-gcm", getSecretsKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return null;
  }
}

export function maskSecret(value: string | null | undefined) {
  if (!value?.trim()) return "";
  const plain = value.startsWith(PREFIX) ? "••••••••" : value;
  if (plain.length <= 4) return "••••";
  return `••••${plain.slice(-4)}`;
}

export function isEncryptedSecret(value: string | null | undefined) {
  return Boolean(value?.startsWith(PREFIX));
}
