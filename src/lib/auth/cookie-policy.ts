const SESSION_COOKIE_BASE_NAME = "estatedesk_session";
const PLATFORM_UNLOCK_COOKIE_BASE_NAME = "estatedesk_platform_api_keys_unlocked";
const SUPPORT_SESSION_COOKIE_BASE_NAME = "estatedesk_support_session";
const REDIRECT_MARKER_COOKIE_NAME = "__Host-redirect_change_pw";
const LEGACY_REDIRECT_MARKER_COOKIE_NAME = "__redirect_change_pw";

const SESSION_TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const SIGNED_SESSION_COOKIE_PATTERN = /^v1\.[a-f0-9]{64}\.[a-f0-9]{32}$/;

type CookieOptionOverrides = Partial<{
  maxAge: number;
  expires: Date;
  path: string;
  sameSite: "strict" | "lax" | "none";
}>;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function prefixedCookieName(baseName: string, prefix: "__Host-" | "__Secure-") {
  return isProduction() ? `${prefix}${baseName}` : baseName;
}

function hardenedCookieOptions(overrides?: CookieOptionOverrides) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: overrides?.sameSite ?? ("strict" as const),
    path: overrides?.path ?? "/",
    priority: "high" as const,
    ...overrides,
  };
}

export function getSessionCookieName() {
  return prefixedCookieName(SESSION_COOKIE_BASE_NAME, "__Host-");
}

export function getPlatformUnlockCookieName() {
  return prefixedCookieName(PLATFORM_UNLOCK_COOKIE_BASE_NAME, "__Secure-");
}

export function getSupportSessionCookieName() {
  return prefixedCookieName(SUPPORT_SESSION_COOKIE_BASE_NAME, "__Secure-");
}

export function getRedirectMarkerCookieName() {
  return isProduction()
    ? REDIRECT_MARKER_COOKIE_NAME
    : LEGACY_REDIRECT_MARKER_COOKIE_NAME;
}

export function getSessionCookieOptions(maxAge: number) {
  return hardenedCookieOptions({ maxAge, sameSite: "strict" });
}

export function getScopedCookieOptions(path: string, maxAge: number) {
  return hardenedCookieOptions({ path, maxAge, sameSite: "strict" });
}

export function getEphemeralCookieOptions(maxAge: number) {
  return hardenedCookieOptions({ maxAge, sameSite: "strict" });
}

export function isSessionTokenShape(value: string) {
  return SESSION_TOKEN_PATTERN.test(value);
}

export function hasValidSessionCookieShape(value: string | undefined | null) {
  if (!value) return false;

  return (
    SIGNED_SESSION_COOKIE_PATTERN.test(value) || SESSION_TOKEN_PATTERN.test(value)
  );
}