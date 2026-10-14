import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";

async function loadService() {
  const bundle = await build({
    entryPoints: [path.resolve("apps/web/src/features/community/service.ts")],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    packages: "external",
    tsconfig: "apps/web/tsconfig.json",
    plugins: [{
      name: "community-notice-fixture",
      setup(builder) {
        builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "fixture" }));
        builder.onResolve({ filter: /^@\// }, args => args.path === "@/lib/prisma" ? { path: args.path, namespace: "fixture" } : undefined);
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: "export const prisma = globalThis.communityNoticeFixture;",
          loader: "js",
        }));
      },
    }],
  });
  const module = { exports: {} as { publishCommunityNotice: (orgId: string, actorId: string, input: object) => Promise<{ id: string; recipients: number; targeted: boolean }> } };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  return module.exports;
}

test("private notices are delivered only to the selected current tenant", async () => {
  const recipientRows: Array<Record<string, unknown>> = [];
  const notificationRows: Array<Record<string, unknown>> = [];
  const state = {
    $transaction: async (work: (tx: object) => Promise<unknown>) => work({
      property: { findFirst: async () => ({ id: "property" }) },
      lease: { findMany: async ({ where }: { where: { tenant: { id?: string } } }) => {
        assert.equal(where.tenant.id, "tenant");
        return [{ tenant: { id: "tenant", userId: "tenant-user" } }];
      } },
      bnbReservation: { findMany: async () => { throw new Error("Private notices must not include guest stays."); } },
      communityNotice: { create: async ({ data }: { data: Record<string, unknown> }) => {
        assert.equal("targetTenantId" in data, false);
        return { id: "notice" };
      } },
      communityNoticeRecipient: { createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => { recipientRows.push(...data); } },
      notification: { createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => { notificationRows.push(...data); } },
    }),
  };
  (globalThis as typeof globalThis & { communityNoticeFixture?: typeof state }).communityNoticeFixture = state;
  try {
    const { publishCommunityNotice } = await loadService();
    const result = await publishCommunityNotice("org", "manager", {
      propertyId: "property",
      targetTenantId: "tenant",
      title: "Private update",
      message: "Please contact the office about your scheduled inspection.",
    });
    assert.deepEqual(result, { id: "notice", recipients: 1, targeted: true });
    assert.equal(recipientRows.length, 1);
    assert.equal(recipientRows[0].tenantId, "tenant");
    assert.equal(notificationRows.length, 1);
    assert.equal(notificationRows[0].userId, "tenant-user");
  } finally {
    delete (globalThis as typeof globalThis & { communityNoticeFixture?: typeof state }).communityNoticeFixture;
  }
});
