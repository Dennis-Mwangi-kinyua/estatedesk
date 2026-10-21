import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../../apps/web/src/proxy";
import { contentSecurityPolicy } from "../../apps/web/src/lib/security/content-security-policy";

test("private HTML has fresh script nonces and ignores caller-supplied nonces", () => {
  const request = () => new NextRequest("https://example.test/login", { headers: { "x-nonce": "attacker", "content-security-policy": "script-src *" } });
  const first = proxy(request());
  const second = proxy(request());
  const policy = first.headers.get("content-security-policy")!;
  const scripts = policy.split(";").find(part => part.trim().startsWith("script-src "))!;
  assert.match(scripts, /'nonce-[A-Za-z0-9+/=]+'/);
  assert.doesNotMatch(scripts, /unsafe-inline|attacker/);
  assert.notEqual(policy, second.headers.get("content-security-policy"));
  assert.equal(first.headers.get("x-middleware-request-content-security-policy"), policy);
});

test("public pages use a cache-compatible policy; production disallows eval and inline event handlers", () => {
  const policy = contentSecurityPolicy();
  assert.doesNotMatch(policy, /unsafe-eval|nonce-/);
  assert.match(policy, /script-src-attr 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(contentSecurityPolicy({ development: true }), /unsafe-eval/);
  assert.match(proxy(new NextRequest("https://example.test/dashboard/org")).headers.get("cache-control")!, /no-store/);
});

test("signed callbacks and public endpoints reach their own request authentication", () => {
  for (const path of ["/api/cron/tenant-credit", "/api/webhooks/whatsapp", "/api/webhooks/kcb-ipn", "/api/monitoring/web-vitals", "/api/indexnow/key", "/api/push/vapid-public-key", "/api/og/vacancy/example"]) {
    assert.equal(proxy(new NextRequest(`https://example.test${path}`, { method: "POST" })).status, 200, path);
  }
  assert.equal(proxy(new NextRequest("https://example.test/api/private-data")).status, 401);
});

test("printouts and account recovery use private crawl and cache headers", () => {
  for (const path of ["/print/owner-statements", "/forgot-password", "/reset-password?token=example", "/verify-email"]) {
    const response = proxy(new NextRequest(`https://example.test${path}`));
    assert.match(response.headers.get("cache-control")!, /no-store/);
    assert.match(response.headers.get("x-robots-tag")!, /noindex/);
  }
  for (const path of ["/login", "/register"]) {
    assert.equal(proxy(new NextRequest(`https://example.test${path}`)).headers.get("x-robots-tag"), null);
  }
});
