import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import type * as Directory from "../../apps/web/src/lib/platform/user-organization-groups";

async function fixture(unassignedCount: number) {
  const reads: { skip: number; take: number; where: unknown }[] = [];
  const userCounts: unknown[] = [];
  const organizations = Array.from({ length: 60 }, (_, i) => ({ id: `org-${i}`, name: `Organization ${i}`, slug: `org-${i}` }));
  const db = {
    organization: { count: async () => organizations.length, findMany: async (args: { skip: number; take: number; where: unknown }) => { reads.push(args); return organizations.slice(args.skip, args.skip + args.take); } },
    user: { count: async (args: { where: unknown }) => { userCounts.push(args.where); return JSON.stringify(args.where).includes('"none"') ? unassignedCount : 7; } },
  };
  const bundle = await build({ entryPoints: ["apps/web/src/lib/platform/user-organization-groups.ts"], bundle: true, write: false, platform: "node", format: "cjs", plugins: [{ name: "directory-db", setup(builder) {
    builder.onResolve({ filter: /^server-only$|^@\/lib\/prisma$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "server-only" ? "" : "export const prisma = db;" }));
  } }] });
  const mod = { exports: {} };
  new Function("db", "module", "exports", bundle.outputFiles[0].text)(db, mod, mod.exports);
  return { directory: mod.exports as typeof Directory, reads, userCounts };
}

test("organization pages have no gaps or duplicates around the unassigned group", async () => {
  const { directory, reads, userCounts } = await fixture(3);
  const first = await directory.getUserOrganizationGroups({ deletedAt: null }, "", 1, 25, true);
  const second = await directory.getUserOrganizationGroups({ deletedAt: null }, "", 2, 25, true);
  assert.equal(first.total, 61);
  assert.equal(first.groups[0].id, directory.UNASSIGNED_USERS);
  assert.equal(first.groups.length, 26);
  assert.equal(first.groups[25].id, second.groups[0].id); // The lookahead becomes page two's first record.
  assert.equal(new Set([...first.groups.slice(0, 25), ...second.groups.slice(0, 25)].map(group => group.id)).size, 50);
  assert.deepEqual(reads.map(({ skip, take }) => ({ skip, take })), [{ skip: 0, take: 25 }, { skip: 24, take: 26 }]);
  assert.ok(userCounts.every(where => JSON.stringify(where).includes('"deletedAt":null')));
});

test("organization filtering requires a live membership and counts users rather than roles", async () => {
  const { directory } = await fixture(0);
  assert.deepEqual(directory.userOrganizationWhere("org-a"), { memberships: { some: { deactivatedAt: null, org: { deletedAt: null }, orgId: "org-a" } } });
  assert.deepEqual(directory.userOrganizationWhere(directory.UNASSIGNED_USERS), { memberships: { none: { deactivatedAt: null, org: { deletedAt: null } } } });
  const result = await directory.getUserOrganizationGroups({ deletedAt: null, status: "ACTIVE" }, "Example", 2, 24);
  assert.equal(result.groups.length, 24);
  assert.equal(result.groups[0].id, "org-24");
  assert.ok(result.groups.every(group => group.count === 7));
});
