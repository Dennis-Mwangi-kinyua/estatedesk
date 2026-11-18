const { test } = require("node:test");
const assert = require("node:assert/strict");
const { appOrigin, trustedNavigation, externalUrl } = require("../policy.cjs");

test("packaged apps only use the production origin", () => {
  assert.equal(appOrigin(), "https://estatedesk.co.ke");
  for (const url of ["http://estatedesk.co.ke", "https://evil.example", "https://estatedesk.co.ke/login", "https://user@estatedesk.co.ke"]) {
    assert.throws(() => appOrigin(url));
  }
});
test("development permits localhost HTTP, but rejects insecure remote origins", () => {
  assert.equal(appOrigin("http://localhost:3000", false), "http://localhost:3000");
  assert.throws(() => appOrigin("http://example.com", false));
  assert.throws(() => appOrigin("file:///tmp/page.html", false));
});
test("navigation rejects lookalike hosts, credentials and non-web protocols", () => {
  const origin = appOrigin();
  assert.equal(trustedNavigation(`${origin}/dashboard?source=desktop`, origin), true);
  for (const url of ["https://estatedesk.co.ke.evil.example", "https://evil.example", "https://user@estatedesk.co.ke", "javascript:alert(1)", "file:///etc/passwd", "not a url"]) {
    assert.equal(trustedNavigation(url, origin), false);
  }
});
test("external browser launches accept only credential-free HTTPS URLs", () => {
  assert.equal(externalUrl("https://example.com/document.pdf"), "https://example.com/document.pdf");
  for (const url of ["file:///etc/passwd", "javascript:alert(1)", "http://example.com", "https://secret@example.com", "ms-settings:privacy"]) assert.equal(externalUrl(url), null);
});
