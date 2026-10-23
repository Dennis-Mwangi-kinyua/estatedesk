import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { proxy } from "../../apps/web/proxy";
import { getSessionCookieName } from "../../apps/web/src/lib/auth/cookie-policy";
import { createSessionCookieValue } from "../../apps/web/src/lib/auth/cookies";
import { randomBytes } from "node:crypto";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config as proxyConfig } from "../../apps/web/src/proxy";

const ROOT = join(import.meta.dirname, "..", "..");

describe("middleware wiring", () => {
  it("gives signed-in users separate page budgets behind a shared IP", () => {
    const tokens = [randomBytes(32).toString("hex"), randomBytes(32).toString("hex")];
    const request = (token: string) => new NextRequest("https://example.test/dashboard/org/tenants", { headers: { "x-forwarded-for": "192.0.2.178", cookie: `${getSessionCookieName()}=${createSessionCookieValue(token)}` } });
    for (let i = 0; i < 30; i++) for (const token of tokens) assert.equal(proxy(request(token)).status, 200);
    for (const token of tokens) assert.equal(proxy(request(token)).status, 429);
  });
  it("does not let invented session signatures bypass the IP page budget", () => {
    const request = () => new NextRequest("https://example.test/dashboard/org/tenants", { headers: { "x-forwarded-for": "192.0.2.179", cookie: `${getSessionCookieName()}=v1.${randomBytes(32).toString("hex")}.${"b".repeat(32)}` } });
    for (let i = 0; i < 30; i++) assert.equal(proxy(request()).status, 200);
    assert.equal(proxy(request()).status, 429);
  });
  it("runs security checks for protected URLs containing dots and encoded dots", () => {
    for (const path of ["/api/receipts/invoice.pdf", "/dashboard/org/acme.co", "/platform/users/person%2Ename", "/api/private.json"]) {
      assert.equal(unstable_doesMiddlewareMatch({ config: proxyConfig, url: `https://example.test${path}` }), true, path);
      const response = proxy(new NextRequest(`https://example.test${path}`));
      assert.equal(response.status, path.startsWith("/api/") ? 401 : 307, path);
      assert.equal(response.headers.get("cache-control")?.includes("no-store"), true);
    }
    for (const path of ["/_next/static/chunks/app.js", "/_next/image?url=test", "/favicon.ico"]) {
      assert.equal(unstable_doesMiddlewareMatch({ config: proxyConfig, url: `https://example.test${path}` }), false, path);
    }
  });
  it("allows only the intended anonymous mobile routes through to handler checks", () => {
    for (const path of ["/account/recovery", "/account/recovery/", "/guest/session", "/guest/requests", "/vacancies", "/vacancies/house.one", "/vacancies/house/inquiries"]) {
      const response = proxy(new NextRequest(`https://example.test/api/mobile${path}`, { method: "POST" }));
      assert.equal(response.status, 200, path);
    }
    for (const path of ["/account/recovery/admin", "/guest/session/admin", "/vacancies/house/private", "/tenant/profile", "/workspace/action", "/security"]) {
      assert.equal(proxy(new NextRequest(`https://example.test/api/mobile${path}`, { method: "POST" })).status, 401, path);
    }
  });
  it("uses exact API segment and referral boundaries for browser navigation", () => {
    assert.equal(proxy(new NextRequest("https://example.test/api-keys", { headers: { accept: "text/html" } })).headers.get("location")?.includes("/login?"), true);
    const response = proxy(new NextRequest("https://example.test/api/marketing/referrals/code/private", { headers: { accept: "text/html" } }));
    assert.equal(new URL(response.headers.get("location")!).pathname, "/are-you-lost");
  });
  it("overwrites client-supplied internal path and CSP headers", () => {
    const response = proxy(new NextRequest("https://example.test/login", { headers: { "x-estatedesk-pathname": "/change-password", "x-nonce": "attacker", "content-security-policy": "script-src *" } }));
    assert.equal(response.headers.get("x-middleware-request-x-estatedesk-pathname"), "/login");
    assert.notEqual(response.headers.get("x-middleware-request-x-nonce"), "attacker");
    assert.equal(response.headers.get("content-security-policy")?.includes("script-src *"), false);
  });
  it("allows subscription invoice viewing and downloading while requiring authentication", () => {
    const cookie = `${getSessionCookieName()}=v1.${"a".repeat(64)}.${"b".repeat(32)}`;
    for (const suffix of ["", "?download=1"]) {
      const url = `https://example.test/api/org/subscription-invoices/invoice-id${suffix}`;
      const headers = { accept: "text/html", "sec-fetch-dest": "document", cookie };
      assert.equal(proxy(new NextRequest(url, { headers })).status, 200);
      assert.equal(proxy(new NextRequest(url, { headers: { accept: "text/html" } })).status, 401);
    }
  });
  it("allows authenticated move-out downloads while guarding other browser API navigation", () => {
    const cookie = `${getSessionCookieName()}=v1.${"a".repeat(64)}.${"b".repeat(32)}`;
    for (const suffix of ["report", "refund-proof"]) {
      const url = `https://example.test/api/move-outs/notice-id/${suffix}`;
      const headers = { accept: "text/html", "sec-fetch-dest": "document", cookie };
      assert.equal(proxy(new NextRequest(url, { headers })).status, 200);
      assert.equal(proxy(new NextRequest(url, { headers: { accept: "text/html" } })).status, 401);
    }
    const blocked = proxy(new NextRequest("https://example.test/api/other", { headers: { accept: "text/html", cookie } }));
    assert.equal(blocked.status, 307);
    assert.equal(new URL(blocked.headers.get("location")!).pathname, "/are-you-lost");
  });
  it("allows receipt browser downloads without clearing the session and still requires authentication", () => {
    const cookie = `${getSessionCookieName()}=v1.${"a".repeat(64)}.${"b".repeat(32)}`;
    for (const headers of [new Headers({ accept: "text/html", cookie }), new Headers({ "sec-fetch-dest": "document", cookie })]) {
      const response = proxy(new NextRequest("https://example.test/api/receipts/receipt-id", { headers }));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("location"), null);
      assert.equal(response.headers.get("set-cookie"), null);
    }
    assert.equal(proxy(new NextRequest("https://example.test/api/receipts/receipt-id", { headers: { accept: "text/html" } })).status, 401);
  });
  it("allows service agreement PDFs while keeping authentication and session cookies intact", () => {
    const cookie = `${getSessionCookieName()}=v1.${"a".repeat(64)}.${"b".repeat(32)}`;
    for (const method of ["GET", "HEAD"]) {
      const url = "https://example.test/api/service-agreements/agreement-id";
      const response = proxy(new NextRequest(url, { method, headers: { accept: "text/html", "sec-fetch-dest": "document", cookie } }));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("location"), null);
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(proxy(new NextRequest(url, { method, headers: { accept: "text/html" } })).status, 401);
    }
    const response = proxy(new NextRequest("https://example.test/are-you-lost?from=%2Fapi%2Fother", { headers: { cookie } }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("location"), null);
  });
  it("requires sign-in before scanning an agreement verification QR and preserves the return target", () => {
    const target = "/agreements/verify/" + "a".repeat(48) + "?hash=" + "b".repeat(64);
    const response = proxy(new NextRequest(`https://example.test${target}`));
    assert.equal(response.status, 307);
    const location = new URL(response.headers.get("location")!);
    assert.equal(location.pathname, "/login");
    assert.equal(location.searchParams.get("returnTo"), target);
    assert.equal(response.headers.get("set-cookie"), null);
  });
  it("delegates to proxy security middleware", () => {
    const middleware = readFileSync(join(ROOT, "apps/web/src/proxy.ts"), "utf8");
    const healthRoute = readFileSync(
      join(ROOT, "apps/web/src/app/api/health/route.ts"),
      "utf8",
    );

    assert.match(middleware, /proxy as handleRequest/);
    assert.match(healthRoute, /await getUserSession\(\)/);
    assert.match(healthRoute, /\["SUPER_ADMIN", "PLATFORM_ADMIN"\]\.includes\(session.platformRole\)/);
    assert.match(healthRoute, /session.mustChangePassword \|\| session.requiresTermsAcceptance/);
    assert.doesNotMatch(healthRoute, /isCronAuthorized|CRON_SECRET/);
  });
});
