import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
test("scheduled notification dispatch rejects missing/wrong secrets before invoking delivery", async () => {
  let runs = 0;
  (globalThis as typeof globalThis & { cronFixture?: object }).cronFixture = { run: async () => { runs++; return { sent: 0 }; } };
  const result = await build({ entryPoints: ["apps/web/src/app/api/cron/notifications/route.ts"], bundle: true, platform: "node", format: "cjs", write: false, plugins: [{ name: "cron-fixture", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/cron\/jobs$/ }, () => ({ path: "jobs", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const runNotificationCron=globalThis.cronFixture.run;" }));
  } }] });
  const module = { exports: {} as { GET: (request: Request) => Promise<Response> } };
  new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  const original = process.env.CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    assert.equal((await module.exports.GET(new Request("https://example.invalid"))).status, 401);
    process.env.CRON_SECRET = "test-cron-key";
    assert.equal((await module.exports.GET(new Request("https://example.invalid", { headers: { Authorization: "Bearer wrong" } }))).status, 401);
    assert.equal(runs, 0);
    const accepted = await module.exports.GET(new Request("https://example.invalid", { headers: { Authorization: "Bearer test-cron-key" } }));
    assert.equal(accepted.status, 200); assert.equal(runs, 1); assert.equal(accepted.headers.get("cache-control"), "no-store");
  } finally {
    if (original === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = original;
    delete (globalThis as typeof globalThis & { cronFixture?: object }).cronFixture;
  }
});
