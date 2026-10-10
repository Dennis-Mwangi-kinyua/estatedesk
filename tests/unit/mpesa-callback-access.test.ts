import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../../apps/web/proxy";

test("Daraja callback reaches its secret-authenticated handler without a browser session", () => {
  for (const path of ["/api/webhooks/mpesa", "/api/webhooks/mpesa/"]) {
    const response = proxy(new NextRequest(`https://example.test${path}?secret=test`, { method: "POST" }));
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.equal(response.status, 200);
  }
});

test("callback exception does not expose nested paths or other private APIs", () => {
  for (const path of ["/api/webhooks/mpesa/private", "/api/webhooks/other", "/api/payments"]) {
    const response = proxy(new NextRequest(`https://example.test${path}`, { method: "POST" }));
    assert.equal(response.status, 401);
  }
});
