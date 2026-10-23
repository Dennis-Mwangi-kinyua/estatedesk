import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";

async function loadAccess<T>(source: string): Promise<T> {
  const bundle = await build({
    entryPoints: [path.resolve(source)],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    packages: "external",
    tsconfig: "apps/web/tsconfig.json",
    plugins: [{
      name: "quota-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "fixture" }));
        builder.onResolve({ filter: /^@\// }, (args) => ({ path: args.path, namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          contents: args.path === "@/lib/prisma"
            ? "export const prisma = {};"
            : args.path === "@/lib/billing/plans"
              ? 'export const APP_PLANS = { FREE: { propertiesLimit: 1, unitsLimit: 5, usersLimit: 2 }, PRO: { propertiesLimit: 3, unitsLimit: 20, usersLimit: 8 }, PLUS: { propertiesLimit: 5, unitsLimit: 100, usersLimit: 25 }, ENTERPRISE: { propertiesLimit: Number.MAX_SAFE_INTEGER, unitsLimit: Number.MAX_SAFE_INTEGER, usersLimit: Number.MAX_SAFE_INTEGER } };'
              : args.path === "@/lib/billing/subscription-access"
                ? "export const SUBSCRIPTION_GRACE_DAYS = 7;"
              : "",
          loader: "js",
        }));
      },
    }],
  });
  const module = { exports: {} as T };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  return module.exports;
}

function quotaClient(state: { units: number; bnbs: number }) {
  return {
    subscription: { findUnique: async () => ({ plan: "FREE", status: "ACTIVE" }) },
    property: { count: async () => 1 },
    unit: { count: async () => state.units },
    bnbListing: { count: async () => state.bnbs },
    membership: { count: async () => 1 },
  };
}

test("unit quotas include BnB listings and reject the sixth Free-plan item", async () => {
  const access = await loadAccess<{
    assertCanCreateUnit(orgId: string, additional: number, client: object): Promise<unknown>;
  }>("apps/web/src/lib/billing/access.ts");
  const client = quotaClient({ units: 3, bnbs: 2 });
  await access.assertCanCreateUnit("org", 0, client);
  await assert.rejects(access.assertCanCreateUnit("org", 1, client), /Upgrade to Pro/);
});

test("organization quota row lock prevents concurrent creates crossing the unit cap", async () => {
  const access = await loadAccess<{
    assertCanCreateUnit(orgId: string, additional: number, client: object): Promise<unknown>;
    lockOrgQuota(tx: object, orgId: string): Promise<void>;
  }>("apps/web/src/lib/billing/access.ts");
  const state = { units: 4, bnbs: 0 };
  const client = quotaClient(state);
  let lockTail = Promise.resolve();

  async function createOne() {
    let unlock = () => {};
    const tx = {
      ...client,
      async $queryRaw() {
        const previous = lockTail;
        lockTail = new Promise<void>((resolve) => { unlock = resolve; });
        await previous;
      },
    };
    try {
      await access.lockOrgQuota(tx, "org");
      await access.assertCanCreateUnit("org", 1, tx);
      state.units += 1;
      return true;
    } finally {
      unlock();
    }
  }

  const results = await Promise.allSettled([createOne(), createOne()]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(state.units, 5);
  assert.match(String((results.find((result) => result.status === "rejected") as PromiseRejectedResult).reason), /Upgrade to Pro/);
});
