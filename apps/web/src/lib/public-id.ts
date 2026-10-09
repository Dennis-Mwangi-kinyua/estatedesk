import { createCipheriv, createDecipheriv, createHash, createHmac } from "node:crypto";

const TOKEN_PREFIX = "ed";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getPublicIdKey() {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.DATABASE_URL ??
    "estatedesk-local-public-id-key";

  return createHash("sha256").update(secret).digest();
}

export function encodePublicId(id: string, scope: string, label = scope) {
  const key = getPublicIdKey();
  const iv = createHmac("sha256", key)
    .update(scope)
    .update(":")
    .update(id)
    .digest()
    .subarray(0, IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(scope));

  const encrypted = Buffer.concat([
    cipher.update(id, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64url");

  return `${slugifyLabel(label)}--${TOKEN_PREFIX}_${payload}`;
}

export function decodePublicId(value: string, scope: string) {
  const slugMarker = `--${TOKEN_PREFIX}_`;
  const slugIndex = value.lastIndexOf(slugMarker);
  const token = slugIndex >= 0 ? value.slice(slugIndex + 2) : value;
  if (!token.startsWith(`${TOKEN_PREFIX}_`)) {
    return value;
  }

  const payload = Buffer.from(token.slice(TOKEN_PREFIX.length + 1), "base64url");

  if (payload.length <= IV_BYTES + TAG_BYTES) {
    throw new Error("Invalid public id token.");
  }

  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const encrypted = payload.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", getPublicIdKey(), iv);
  decipher.setAAD(Buffer.from(scope));
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function isEncodedPublicId(value: string) {
  return value.startsWith(`${TOKEN_PREFIX}_`) || value.includes(`--${TOKEN_PREFIX}_`);
}

function slugifyLabel(label: string) {
  return label.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "record";
}

export function encodePublicSlug(id: string, scope: string, label: string) {
  return `${slugifyLabel(label)}--${encodePublicId(id, scope)}`;
}

export function decodePublicSlug(value: string, scope: string) {
  const marker = `--${TOKEN_PREFIX}_`;
  const markerIndex = value.lastIndexOf(marker);
  return markerIndex < 0 ? decodePublicId(value, scope) : decodePublicId(value.slice(markerIndex + 2), scope);
}
