import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
test("retention reporting pages every organization while bounding database fan-out", async () => {
  let active = 0, peak = 0, pages = 0;
  const organizations = Array.from({ length: 205 }, (_, i) => ({ id: String(i).padStart(4, "0"), name: `Org ${String(i).padStart(4, "0")}`, dataRetentionDays: 30 }));
  const state = { db: new Proxy({}, { get(_target, model) {
    if (model === "organization") return { findMany: async ({ where, take }: { where: { id?: { gt: string } }; take: number }) => { pages++; assert.equal(take, 100); return organizations.filter(v => !where.id || v.id > where.id.gt).slice(0, take); } };
    return { count: async () => { active++; peak = Math.max(peak, active); await new Promise(resolve => setTimeout(resolve, 1)); active--; return 1; } };
  } }) };
  (globalThis as typeof globalThis & { retentionFixture?: object }).retentionFixture = state;
  try {
    const result = await build({ entryPoints: ["apps/web/src/lib/data-retention/report.ts"], bundle: true, platform: "node", format: "cjs", write: false, plugins: [{ name: "retention-fixture", setup(builder) {
      builder.onResolve({ filter: /^server-only$|^@\/lib\/prisma$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "server-only" ? "" : "export const prisma=globalThis.retentionFixture.db;" }));
    } }] });
    const module = { exports: {} as { buildRetentionReport: () => Promise<{ total: number }[]> } };
    new Function("require", "module", "exports", result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
    const report = await module.exports.buildRetentionReport();
    assert.equal(pages, 3); assert.equal(report.length, 205); assert.ok(report.every(v => v.total === 8));
    assert.ok(peak <= 32, `Observed ${peak} outstanding count queries`);
  } finally { delete (globalThis as typeof globalThis & { retentionFixture?: object }).retentionFixture; }
});
