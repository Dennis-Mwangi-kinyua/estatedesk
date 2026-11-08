import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";

test("admin directory caching restores dates while active-admin safeguards remain uncached", async () => {
  let reads = 0;
  let counts = 0;
  let cacheOptions: { revalidate: number; tags: string[] } | undefined;
  const fixture = {
    id: "admin", createdAt: new Date("2026-11-06T08:00:00Z"),
    emailVerified: new Date("2026-11-06T08:00:00Z"), phoneVerified: null,
  };
  const prisma = { user: {
    findMany: async () => { reads++; return [fixture]; },
    count: async () => { counts++; return counts; },
  } };
  const cache = (query: () => Promise<unknown>, _keys: string[], options: typeof cacheOptions) => {
    cacheOptions = options;
    let stored: string | undefined;
    return async () => {
      if (!stored) stored = JSON.stringify(await query());
      return JSON.parse(stored);
    };
  };
  const bundle = await build({
    entryPoints: ["apps/web/src/app/(app)/platform/admins/_lib/queries.ts"],
    bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
    tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "fixtures", setup(builder) {
      builder.onResolve({ filter: /^(server-only|next\/cache|@prisma\/client|@\/lib\/(prisma|db\/retry))$/ }, (args) => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({ loader: "js", contents:
        args.path === "server-only" ? "" :
        args.path === "next/cache" ? "export const unstable_cache=cache" :
        args.path === "@prisma/client" ? 'export const PlatformRole={PLATFORM_ADMIN:"PLATFORM_ADMIN",SUPER_ADMIN:"SUPER_ADMIN"}' :
        args.path.endsWith("/prisma") ? "export const prisma=db" :
        "export const retryTransientDatabaseOperation=(operation)=>operation()",
      }));
    } }],
  });
  const mod = { exports: {} as {
    getPlatformAdmins(): Promise<typeof fixture[]>;
    countActivePlatformAdmins(): Promise<number>;
  } };
  new Function("require", "module", "exports", "cache", "db", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports, cache, prisma);
  for (let i = 0; i < 2; i++) {
    const [admin] = await mod.exports.getPlatformAdmins();
    assert.ok(admin.createdAt instanceof Date);
    assert.ok(admin.emailVerified instanceof Date);
    assert.equal(admin.createdAt.toISOString(), fixture.createdAt.toISOString());
    assert.equal(admin.phoneVerified, null);
  }
  assert.equal(reads, 1);
  assert.equal(cacheOptions?.revalidate, 30);
  assert.deepEqual(cacheOptions?.tags, ["platform-admin-directory"]);
  assert.equal(await mod.exports.countActivePlatformAdmins(), 1);
  assert.equal(await mod.exports.countActivePlatformAdmins(), 2);
});
