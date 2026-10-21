import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";

test("public notice polls share a cached lookup and expired notices are suppressed on every read", async () => {
  const fixture = { reads: 0, notice: { message: "Scheduled maintenance", startsAt: new Date(), endsAt: new Date(Date.now() + 60000) } };
  const bundle = await build({ entryPoints: ["apps/web/src/features/platform-updates/service.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "notice-cache", setup(builder) {
    const mocks: Record<string, string> = {
      "server-only": "",
      "@/lib/prisma": "export const prisma={platformUpdateNotice:{findUnique:async()=>{fixture.reads++;return fixture.notice;}}};",
      "next/cache": `export function unstable_cache(fn,keys,options){if(options.revalidate!==30||!options.tags.includes('public-update-notice'))throw new Error('Expected bounded tagged cache');let pending;return ()=>pending??=(fn());}`,
    };
    builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: "fixture" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js" }));
  } }] });
  const mod = { exports: {} as { getUpdateNotice: () => Promise<{ message: string } | null> } };
  new Function("require", "module", "exports", "fixture", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports, fixture);
  const notices = await Promise.all(Array.from({ length: 50 }, () => mod.exports.getUpdateNotice()));
  assert.ok(notices.every(notice => notice?.message === fixture.notice.message));
  assert.equal(fixture.reads, 1);
  fixture.notice.endsAt = new Date(0);
  assert.equal(await mod.exports.getUpdateNotice(), null);
});
