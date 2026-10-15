import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";
import { configureTestDatabase } from "./database-safety";
const url = configureTestDatabase();

test("membership switching rejects another user, deactivated membership and expired session", { skip: !url }, async () => {
  const [{ prisma }, { createSessionCookieValue }, { hashOpaqueToken }] = await Promise.all([import("../../apps/web/src/lib/prisma"), import("../../apps/web/src/lib/auth/cookies"), import("../../apps/web/src/lib/crypto/tokens")]);
  const org = await prisma.organization.create({ data: { name: "Switch test", slug: `switch-${Date.now()}` } });
  const user = await prisma.user.create({ data: { fullName: "Switch account", passwordHash: "not-a-password" } });
  const outsider = await prisma.user.create({ data: { fullName: "Other switch account", passwordHash: "not-a-password" } });
  const own = await prisma.membership.create({ data: { orgId: org.id, userId: user.id, role: "OFFICE" } });
  const blocked = await prisma.membership.create({ data: { orgId: org.id, userId: user.id, role: "MANAGER", deactivatedAt: new Date() } });
  const foreign = await prisma.membership.create({ data: { orgId: org.id, userId: outsider.id, role: "ADMIN" } });
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashOpaqueToken(token, "session");
  await prisma.userSession.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60000) } });
  const global = globalThis as typeof globalThis & { switchTestCookies?: object };
  global.switchTestCookies = { get: () => ({ value: createSessionCookieValue(token) }), set: () => {}, delete: () => {} };
  try {
    const bundle = await build({ entryPoints: ["apps/web/src/lib/auth/session.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "request-context", setup(b) {
      b.onResolve({ filter: /^next\/(headers|navigation)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/navigation" ? 'export const redirect = () => { throw new Error("NEXT_REDIRECT"); };' : 'export const cookies = async () => globalThis.switchTestCookies; export const headers = async () => new Headers();', loader: "js" }));
    } }] });
    const module = { exports: {} as { switchActiveMembership: (id: string) => Promise<void> } };
    new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
    await assert.rejects(module.exports.switchActiveMembership(foreign.id), /not found/i);
    await assert.rejects(module.exports.switchActiveMembership(blocked.id), /not found/i);
    await module.exports.switchActiveMembership(own.id);
    assert.equal((await prisma.userSession.findUniqueOrThrow({ where: { tokenHash } })).activeMembershipId, own.id);
    await prisma.userSession.update({ where: { tokenHash }, data: { expiresAt: new Date(0) } });
    await assert.rejects(module.exports.switchActiveMembership(own.id), /NEXT_REDIRECT/);
  } finally {
    delete global.switchTestCookies;
    await prisma.organization.delete({ where: { id: org.id } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, outsider.id] } } });
    await prisma.$disconnect();
  }
});
