import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { proxy } from "../../apps/web/proxy";
import { getSessionCookieName } from "../../apps/web/src/lib/auth/cookie-policy";

const ROOT = join(import.meta.dirname, "..", "..");

describe("middleware wiring", () => {
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
  it("delegates to proxy security middleware", () => {
    const middleware = readFileSync(join(ROOT, "apps/web/middleware.ts"), "utf8");
    const healthRoute = readFileSync(
      join(ROOT, "apps/web/src/app/api/health/route.ts"),
      "utf8",
    );

    assert.match(middleware, /proxy as middleware/);
    assert.match(healthRoute, /await getUserSession\(\)/);
    assert.match(healthRoute, /\["SUPER_ADMIN", "PLATFORM_ADMIN"\]\.includes\(session.platformRole\)/);
    assert.match(healthRoute, /session.mustChangePassword \|\| session.requiresTermsAcceptance/);
    assert.doesNotMatch(healthRoute, /isCronAuthorized|CRON_SECRET/);
  });
});
