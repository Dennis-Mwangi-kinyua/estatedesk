import "server-only";

import crypto from "node:crypto";

type TokenPurpose = "password-reset" | "email-verification" | "invitation";

function getTokenHashSecret() {
  return (
    process.env.AUTH_SECRET ??
    process.env.CRON_SECRET ??
    process.env.DATABASE_URL ??
    "estatedesk-local-token-hash-secret"
  );
}

export function hashOpaqueToken(token: string, purpose: TokenPurpose) {
  return crypto
    .createHmac("sha256", getTokenHashSecret())
    .update(purpose)
    .update("\0")
    .update(token)
    .digest("hex");
}

export function legacyHashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
