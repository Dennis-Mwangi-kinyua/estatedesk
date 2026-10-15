import assert from "node:assert/strict";
import { test } from "node:test";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";

test("security alerts use a bounded request and retain the event payload", async () => {
  const bundle = await build({ entryPoints: ["apps/web/src/lib/security/alerts.ts"], bundle: true, write: false, platform: "node", format: "cjs", plugins: [{ name: "server-only", setup(b) { b.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "fixture" })); b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "", loader: "js" })); } }] });
  const module = { exports: {} as { sendSecurityAlert: (event: object) => Promise<void> } };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SECURITY_ALERT_WEBHOOK_URL;
  try {
    process.env.SECURITY_ALERT_WEBHOOK_URL = "https://local-fixture.invalid/alerts";
    let captured: RequestInit | undefined;
    globalThis.fetch = async (_url, options) => { captured = options; return new Response(null, { status: 204 }); };
    await module.exports.sendSecurityAlert({ event: "TEST_ONLY", summary: "Fictional alert", severity: "warning" });
    assert.ok(captured?.signal instanceof AbortSignal);
    assert.equal(captured?.method, "POST");
    assert.equal(JSON.parse(String(captured?.body)).event, "TEST_ONLY");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SECURITY_ALERT_WEBHOOK_URL; else process.env.SECURITY_ALERT_WEBHOOK_URL = originalUrl;
  }
});
