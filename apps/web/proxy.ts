import { NextRequest, NextResponse } from "next/server";
import { contentSecurityPolicy } from "./src/lib/security/content-security-policy";
import { isTenantPortalRequest } from "./src/lib/mobile/portal-policy";
import {
  getSessionCookieName,
  hasValidSessionCookieShape,
} from "@/lib/auth/cookie-policy";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const PROTECTED_PREFIXES = [
  "/agreements/verify",
  "/provider",
  "/change-password",
  "/dashboard",
  "/profile",
  "/platform",
  "/staff",
  "/properties",
  "/buildings",
  "/units",
  "/charges",
  "/tenants",
  "/reports",
  "/inspections",
  "/issues",
  "/move-outs",
  "/taxes",
  "/api-keys",
  "/api",
];

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify-document",
  "/accept-invite",
  "/access-denied",
  "/_next",
];

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const CLEANUP_INTERVAL_MS = 5 * 60_000;
const MAX_RATE_LIMIT_ENTRIES = 10_000;
const RATE_LIMITED_PATHS = new Set(["/dashboard/org/tenants"]);
const API_BROWSER_DESTINATIONS = new Set(["document", "iframe"]);

const globalForRateLimit = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, RateLimitEntry>;
  __rateLimitLastCleanupAt?: number;
};

const rateLimitStore =
  globalForRateLimit.__rateLimitStore ??
  (globalForRateLimit.__rateLimitStore = new Map<string, RateLimitEntry>());

function cleanupExpiredEntries(now: number) {
  const lastCleanupAt = globalForRateLimit.__rateLimitLastCleanupAt ?? 0;

  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  globalForRateLimit.__rateLimitLastCleanupAt = now;
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim().slice(0, 64) || "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);

  return "unknown";
}

function getRateLimitKey(req: NextRequest): string {
  const ip = getClientIp(req);
  const pathname = req.nextUrl.pathname;

  return `tenants-page:${ip}:${pathname}`;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    // Keep this best-effort per-instance guard from growing without bound if
    // clients send many distinct forwarding-header values.
    if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldestKey = rateLimitStore.keys().next().value;
      if (oldestKey) rateLimitStore.delete(oldestKey);
    }
    const resetAt = now + WINDOW_MS;

    const entry: RateLimitEntry = {
      count: 1,
      resetAt,
    };

    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      resetAt,
    };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - existing.count,
    resetAt: existing.resetAt,
  };
}

const PUBLIC_API_PATHS = new Set([
  "/api/mobile/login",
  "/api/platform/update-notice", "/api/health", "/api/cron/tenant-credit", "/api/cron/notifications", "/api/cron/retention",
  "/api/webhooks/mpesa", "/api/webhooks/kcb-ipn", "/api/webhooks/kra-etims", "/api/webhooks/whatsapp",
  "/api/monitoring/web-vitals", "/api/monitoring/client-errors", "/api/indexnow/key",
  "/api/push/vapid-public-key", "/api/auth/accept-invite", "/api/public/vacant-houses", "/api/pwa/badge-count",
]);

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/api/")) {
    const normalized = pathname.replace(/\/$/, "");
    return PUBLIC_API_PATHS.has(normalized) || /^\/api\/(og\/vacancy|marketing\/referrals)\/[^/]+\/?$/.test(pathname);
  }
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldNoIndex(pathname: string) {
  return (
    isProtectedPath(pathname) ||
    pathname.startsWith("/guest-stay") ||
    pathname.startsWith("/change-password") ||
    pathname.startsWith("/access-denied") ||
    pathname.startsWith("/sign-lease") ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/are-you-lost") ||
    pathname.startsWith("/account-suspended") ||
    pathname.startsWith("/service-terminated")
  );
}

function applySecurityHeaders(response: NextResponse, pathname: string, csp?: string) {
  if (csp) response.headers.set("Content-Security-Policy", csp);
  const isPrivate = shouldNoIndex(pathname);

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Referrer-Policy",
    // Keep private URLs off other origins while preserving same-origin POST
    // Origin headers required by Next's Server Action CSRF checks.
    isPrivate ? "same-origin" : "strict-origin-when-cross-origin",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), display-capture=()",
  );

  if (isPrivate) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set(
      "Cache-Control",
      "private, no-store, no-cache, max-age=0, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

function isBrowserApiNavigation(req: NextRequest) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  // The native tenant bootstrap deliberately commits an HTML document/cookie.
  // The route still validates the live tenant session and setup gates.
  if (["/api/mobile/tenant/portal", "/api/mobile/workspace/portal"].includes(req.nextUrl.pathname) && isTenantPortalRequest(req)) return false;
  // These authenticated routes intentionally serve browser downloads.
  if (/^\/api\/move-outs\/[^/]+\/(report|refund-proof)\/?$/.test(req.nextUrl.pathname)) return false;

  if (/^\/api\/service-agreements\/[^/]+\/?$/.test(req.nextUrl.pathname)) return false;
  if (/^\/api\/receipts\/[^/]+\/?$/.test(req.nextUrl.pathname)) return false;
  if (/^\/api\/org\/subscription-invoices\/[^/]+\/?$/.test(req.nextUrl.pathname)) return false;

  if (/^\/api\/platform\/subscription-invoices\/[^/]+\/?$/.test(req.nextUrl.pathname)) return false;

  const accept = req.headers.get("accept") ?? "";
  const destination = req.headers.get("sec-fetch-dest") ?? "";

  return (
    API_BROWSER_DESTINATIONS.has(destination) ||
    accept.includes("text/html")
  );
}

function applyTenantRateLimit(req: NextRequest, response: NextResponse) {
  const key = getRateLimitKey(req);
  const result = checkRateLimit(key);

  const resetSeconds = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );

  if (!result.allowed) {
    return applySecurityHeaders(
      new NextResponse("Too many requests. Please try again later.", {
        status: 429,
        headers: {
          "Retry-After": String(resetSeconds),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
        },
      }),
      req.nextUrl.pathname,
    );
  }

  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.floor(result.resetAt / 1000)),
  );

  return response;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookieValue = req.cookies.get(getSessionCookieName())?.value;
  const hasSession = hasValidSessionCookieShape(sessionCookieValue);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-estatedesk-pathname", pathname);
  requestHeaders.delete("x-nonce");
  requestHeaders.delete("content-security-policy");
  const strictScripts = shouldNoIndex(pathname) || /^\/(login|register|forgot-password|reset-password|verify-email|accept-invite)(\/|$)/.test(pathname);
  const nonce = strictScripts ? Buffer.from(crypto.randomUUID()).toString("base64") : undefined;
  const csp = contentSecurityPolicy({ nonce, development: process.env.NODE_ENV !== "production" });
  if (nonce) {
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }
  const secureResponse = (response: NextResponse, path: string) => applySecurityHeaders(response, path, csp);

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/marketing/referrals/") && isBrowserApiNavigation(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/are-you-lost";
    url.searchParams.set("from", pathname);
    return secureResponse(NextResponse.redirect(url), pathname);
  }

  if (isPublicPath(pathname)) {
    return secureResponse(
      NextResponse.next({ request: { headers: requestHeaders } }),
      pathname,
    );
  }

  if (isProtectedPath(pathname) && !hasSession) {
    if (pathname.startsWith("/api")) {
      return secureResponse(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        pathname,
      );
    }

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", `${pathname}${req.nextUrl.search}`);
    return secureResponse(NextResponse.redirect(url), pathname);
  }

  const response = secureResponse(
    NextResponse.next({ request: { headers: requestHeaders } }),
    pathname,
  );

  if (RATE_LIMITED_PATHS.has(pathname)) {
    return applyTenantRateLimit(req, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
