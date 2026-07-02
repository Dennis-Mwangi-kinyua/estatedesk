import crypto from "node:crypto";
import {
  getEphemeralCookieOptions,
  getPlatformUnlockCookieName,
  getRedirectMarkerCookieName,
  getScopedCookieOptions,
  getSessionCookieName,
  getSessionCookieOptions,
  isSessionTokenShape,
} from "@/lib/auth/cookie-policy";

const SIGNED_COOKIE_VERSION = "v1";

export {
  getEphemeralCookieOptions,
  getPlatformUnlockCookieName,
  getRedirectMarkerCookieName,
  getScopedCookieOptions,
  getSessionCookieName,
  getSessionCookieOptions,
  hasValidSessionCookieShape,
} from "@/lib/auth/cookie-policy";

function getCookieSigningSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production for cookie signing.");
  }

  return secret ?? process.env.CRON_SECRET ?? "estatedesk-dev-cookie-secret";
}

function signPayload(payload: string, purpose: string) {
  const mac = crypto
    .createHmac("sha256", getCookieSigningSecret())
    .update(purpose)
    .update("\0")
    .update(payload)
    .digest("hex")
    .slice(0, 32);

  return `${SIGNED_COOKIE_VERSION}.${payload}.${mac}`;
}

function verifySignedPayload(value: string, purpose: string) {
  const match = value.match(/^v1\.([^.]+)\.([a-f0-9]{32})$/);
  if (!match) return null;

  const [, payload, providedMac] = match;
  const expectedMac = crypto
    .createHmac("sha256", getCookieSigningSecret())
    .update(purpose)
    .update("\0")
    .update(payload)
    .digest("hex")
    .slice(0, 32);

  const provided = Buffer.from(providedMac, "utf8");
  const expected = Buffer.from(expectedMac, "utf8");

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  return payload;
}

export function createSessionCookieValue(token: string) {
  if (!isSessionTokenShape(token)) {
    throw new Error("Invalid session token format.");
  }

  return signPayload(token, "session-cookie");
}

export function parseSessionCookieValue(value: string | undefined | null) {
  if (!value) return null;

  if (value.startsWith(`${SIGNED_COOKIE_VERSION}.`)) {
    const verified = verifySignedPayload(value, "session-cookie");
    if (!verified || !isSessionTokenShape(verified)) return null;
    return verified;
  }

  if (isSessionTokenShape(value)) {
    return value;
  }

  return null;
}

export function createPlatformUnlockCookieValue(input: {
  userId: string;
  expiresAtUnix: number;
}) {
  const payload = `${input.expiresAtUnix}:${input.userId}`;
  return signPayload(payload, "platform-api-keys-unlock");
}

export function parsePlatformUnlockCookieValue(value: string | undefined | null) {
  if (!value) return null;

  const payload = verifySignedPayload(value, "platform-api-keys-unlock");
  if (!payload) return null;

  const separatorIndex = payload.indexOf(":");
  if (separatorIndex <= 0) return null;

  const expiresAtRaw = payload.slice(0, separatorIndex);
  const userId = payload.slice(separatorIndex + 1);
  const expiresAtUnix = Number(expiresAtRaw);

  if (!userId || !Number.isFinite(expiresAtUnix)) return null;
  if (expiresAtUnix <= Math.floor(Date.now() / 1000)) return null;

  return { userId, expiresAtUnix };
}

export function createRedirectMarkerCookieValue() {
  return signPayload(String(Date.now()), "redirect-marker");
}

export function hasValidRedirectMarkerCookie(value: string | undefined | null) {
  if (!value) return false;
  return verifySignedPayload(value, "redirect-marker") !== null;
}