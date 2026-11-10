import assert from "node:assert/strict";
import { it } from "node:test";
import { isSameOriginBrowserMutation } from "../../apps/web/src/lib/security/browser-origin";

it("validates exact public origins behind a reverse proxy without accepting cross-site browser mutations", () => {
  const headers = { origin: "https://estatedesk.example", host: "estatedesk.example", "x-forwarded-proto": "https", "sec-fetch-site": "same-origin" };
  const check = (changes: Record<string, string>) => isSameOriginBrowserMutation(new Request("http://127.0.0.1:3000/api/notifications/read", { headers: { ...headers, ...changes } }));
  assert.equal(check({}), true);
  assert.equal(check({ host: "internal:3000", "x-forwarded-host": "estatedesk.example" }), true);
  assert.equal(check({ origin: "https://external.example" }), false);
  assert.equal(check({ origin: "http://estatedesk.example" }), false);
  assert.equal(check({ origin: "https://estatedesk.example:444" }), false);
  assert.equal(check({ origin: "https://estatedesk.example/other" }), false);
  assert.equal(check({ origin: "https://user:password@estatedesk.example" }), false);
  assert.equal(check({ "sec-fetch-site": "cross-site" }), false);
  assert.equal(check({ "sec-fetch-site": "same-site" }), false);
  assert.equal(check({ origin: "null" }), false);
  assert.equal(isSameOriginBrowserMutation(new Request("http://localhost:3000")), false);
  assert.equal(isSameOriginBrowserMutation(new Request("http://localhost:3000", { headers: { origin: "http://localhost:3000" } })), true);
});
