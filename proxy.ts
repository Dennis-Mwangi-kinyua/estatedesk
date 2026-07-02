import { NextRequest, NextResponse } from "next/server";
import {
  getSessionCookieName,
  hasValidSessionCookieShape,
} from "@/lib/auth/cookie-policy";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/platform",
  "/staff",
  "/properties",
  "/buildings",
  "/units",
  "/charges",
  "/tenants",
  "/reports",
  "/api",
];

const PUBLIC_PREFIXES = [
  "/api/health",
  "/api/cron/notifications",
  "/api/cron/retention",
  "/api/auth/accept-invite",
  "/api/public/vacant-houses",
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
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

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

function isPublicPath(pathname: string) {
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
    pathname.startsWith("/login") ||
    pathname.startsWith("/are-you-lost") ||
    pathname.startsWith("/account-suspended") ||
    pathname.startsWith("/service-terminated") ||
    pathname.startsWith("/verify-document")
  );
}

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  if (shouldNoIndex(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

function isBrowserApiNavigation(req: NextRequest) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;

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

  if (pathname.startsWith("/api") && isBrowserApiNavigation(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/are-you-lost";
    url.searchParams.set("from", pathname);
    return applySecurityHeaders(NextResponse.redirect(url), pathname);
  }

  if (isPublicPath(pathname)) {
    return applySecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      pathname,
    );
  }

  if (isProtectedPath(pathname) && !hasSession) {
    if (pathname.startsWith("/api")) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        pathname,
      );
    }

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(url), pathname);
  }

  const response = applySecurityHeaders(
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
