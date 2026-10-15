import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { proxy } from "../../apps/web/proxy";
import { getSessionCookieName } from "../../apps/web/src/lib/auth/cookie-policy";

const ROOT = join(import.meta.dirname, "..", "..");

describe("middleware wiring", () => {
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
