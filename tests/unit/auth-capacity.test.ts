import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";

function pairBarrier() {
  const waiting: Array<() => void> = [];
  return () => new Promise<void>(resolve => {
    waiting.push(resolve);
    if (waiting.length === 2) waiting.forEach(release => release());
  });
}

async function fixture() {
  const accountReads = pairBarrier();
  const policyReads = pairBarrier();
  const scopes: unknown[] = [];
  const state = {
    revoked: false, membershipRevoked: false, status: "ACTIVE", deletes: 0, policyCalls: 0,
    prisma: {} as Record<string, unknown>,
  };
  state.prisma = {
    userSession: {
      findUnique: async () => state.revoked ? null : ({ id: "session", userId: "user", tokenHash: "token", activeMembershipId: "member", lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 30 * 86400000) }),
      deleteMany: async () => { state.deletes++; return { count: 1 }; },
    },
    user: { findUnique: async () => { await accountReads(); return { id: "user", status: state.status, deletedAt: null, platformRole: "USER", termsAcceptedAt: new Date() }; } },
    membership: { findFirst: async (input: unknown) => {
      scopes.push(input); await accountReads();
      return state.membershipRevoked ? null : { orgId: "org", role: "ADMIN", scopeType: "ORG", scopeId: "ORG_SCOPE", grantedPermissions: [] };
    } },
    organizationSettings: { findUnique: async () => { state.policyCalls++; await policyReads(); return { roleAccess: {} }; } },
    subscription: { findUnique: async () => { state.policyCalls++; await policyReads(); return { plan: "FREE", metadata: null }; } },
  };
  const stubs: Record<string, string> = {
    "server-only": "",
    "react": "export const cache=f=>f;",
    "next/headers": 'export const cookies=async()=>({get:()=>({value:"token"}),set(){}}); export const headers=async()=>new Headers({"x-estatedesk-pathname":"/dashboard/org"});',
    "next/navigation": 'export const redirect=()=>{throw new Error("redirect")};',
    "@/lib/prisma": "export const prisma=state.prisma;",
    "@/lib/auth/cookies": 'export const createSessionCookieValue=x=>x; export const parseSessionCookieValue=x=>x; export const getSessionCookieName=()=>"session"; export const getSessionCookieOptions=()=>({});',
    "@/lib/crypto/tokens": 'export const hashOpaqueToken=x=>x; export const legacyHashOpaqueToken=x=>"legacy-"+x;',
    "@/lib/db/retry": "export const retryTransientDatabaseOperation=f=>f();",
    "@/lib/auth/presence": "export const getSessionHeartbeatBefore=now=>new Date(now.getTime()-60000);",
    "@/lib/auth/security-gate": "export const isSecurityGatePathname=()=>false;",
    "@/lib/permissions/workspace-access": "export const canAccessWorkspacePath=()=>true;",
    "@/lib/permissions/org-role-policy": "export const readOrgRolePolicies=()=>({ADMIN:{}}); export const rolePolicyBlocksPath=()=>false;",
    "@/lib/billing/organization-plan-policy": "export const applyOrganizationPlanAccess=x=>x;",
  };
  const bundle = await build({ entryPoints: [path.resolve("apps/web/src/lib/auth/session.ts")], bundle: true, write: false, format: "cjs", platform: "node", packages: "external", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "session-capacity", setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => args.path in stubs ? { path: args.path, namespace: "fixture" } : undefined);
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: stubs[args.path], loader: "js" }));
    } }],
  });
  const module = { exports: {} as { getUserSession: () => Promise<{ activeOrgId: string | null } | null> } };
  new Function("state", "require", "module", "exports", bundle.outputFiles[0].text)(state, createRequire(path.resolve("package.json")), module, module.exports);
  return { state, scopes, read: module.exports.getUserSession };
}

test("shared authentication overlaps independent reads while retaining membership scope", { timeout: 5000 }, async () => {
  const f = await fixture();
  assert.equal((await f.read())?.activeOrgId, "org");
  assert.equal(f.state.policyCalls, 2);
  assert.deepEqual(f.scopes, [{ where: { id: "member", userId: "user", deactivatedAt: null, employmentEndedAt: null }, select: { orgId: true, grantedPermissions: true, role: true, scopeType: true, scopeId: true } }]);
  f.state.revoked = true;
  assert.equal(await f.read(), null, "revocation remains effective on the next request");
});

test("disabled accounts and revoked memberships cannot gain access through concurrent reads", { timeout: 5000 }, async () => {
  const disabled = await fixture(); disabled.state.status = "SUSPENDED";
  assert.equal(await disabled.read(), null);
  assert.equal(disabled.state.deletes, 1);
  assert.equal(disabled.state.policyCalls, 0);
  const revoked = await fixture(); revoked.state.membershipRevoked = true;
  assert.equal((await revoked.read())?.activeOrgId, null);
  assert.equal(revoked.state.policyCalls, 0);
});
