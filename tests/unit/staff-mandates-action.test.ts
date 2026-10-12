import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import path from "node:path";
import vm from "node:vm";
async function harness(actorRole = "ADMIN", targetRole = "OFFICE", targetOrg = "org") {
  const writes: Array<Record<string, unknown>> = [];
  const audits: Array<Record<string, unknown>> = [];
  const lookups: Array<Record<string, unknown>> = [];
  const tx = {
    membership: {
      findFirst: async (args: { where: Record<string, unknown> }) => {
        lookups.push(args.where);
        return args.where.orgId === targetOrg ? { id: "member", userId: "worker", role: targetRole, grantedPermissions: ["payments.verify"] } : null;
      },
      update: async (args: Record<string, unknown>) => { writes.push(args); },
    },
    auditLog: { create: async (args: Record<string, unknown>) => { audits.push(args); } },
  };
  const h = {
    prisma: { $transaction: async (callback: (db: unknown) => Promise<unknown>) => callback(tx) },
    requireOrgRole: async (roles: string[]) => {
      if (!roles.includes(actorRole)) throw new Error("Forbidden");
      return { userId: "admin", activeOrgId: "org", activeOrgRole: actorRole };
    },
    revalidatePath: () => {},
    notifyInAppAndPush: async () => {},
  };
  const result = await build({ entryPoints: [path.resolve("apps/web/src/features/staff/actions/update-staff-mandates.ts")], bundle: true, write: false, format: "cjs", platform: "node", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "dependencies", setup(builder) {
    builder.onResolve({ filter: /^(next\/cache|@\/lib\/)/ }, args => args.path.endsWith("role-matrix") ? undefined : { path: args.path, namespace: "mock" });
    builder.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: args.path.endsWith("prisma") ? "export const prisma=globalThis.h.prisma;" : args.path.endsWith("guards") ? "export const requireOrgRole=globalThis.h.requireOrgRole;" : args.path.endsWith("notify") ? "export const notifyInAppAndPush=globalThis.h.notifyInAppAndPush;" : "export const revalidatePath=globalThis.h.revalidatePath;", loader: "js" }));
  } }] });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, { module, exports: module.exports, h });
  const action = (module.exports as { updateStaffMandates: (form: FormData) => Promise<{ ok: boolean }> }).updateStaffMandates;
  return { action, writes, audits, lookups };
}
function form(permissions = ["move-outs.arrears.approve"]) {
  const data = new FormData(); data.set("membershipId", "member"); data.set("note", "Authorised to review handovers while the admin is away.");
  for (const permission of permissions) data.append("permissions", permission);
  return data;
}
test("only an organisation admin can assign or revoke mandates", async () => {
  for (const role of ["OFFICE", "MANAGER", "ACCOUNTANT", "TENANT"]) {
    const h = await harness(role);
    await assert.rejects(h.action(form()), /Forbidden/);
    assert.equal(h.writes.length, 0);
  }
});
test("mandates are scoped to active staff in the admin's organisation", async () => {
  for (const [role, org] of [["OFFICE", "other-org"], ["ADMIN", "org"], ["TENANT", "org"], ["CARETAKER", "org"]]) {
    const h = await harness("ADMIN", role, org);
    await assert.rejects(h.action(form()), /active office worker/);
    assert.equal(h.writes.length, 0);
  }
});
test("grant and revoke record previous permissions and require active membership", async () => {
  const h = await harness();
  assert.equal((await h.action(form())).ok, true);
  assert.equal((await h.action(form([]))).ok, true);
  assert.equal(h.lookups[0].orgId, "org");
  assert.equal(h.lookups[0].deactivatedAt, null);
  assert.equal(h.lookups[0].employmentEndedAt, null);
  assert.equal(JSON.stringify(h.writes[0]), JSON.stringify({ where: { id: "member" }, data: { grantedPermissions: ["move-outs.arrears.approve"] } }));
  assert.equal(JSON.stringify(h.writes[1]), JSON.stringify({ where: { id: "member" }, data: { grantedPermissions: [] } }));
  assert.equal(h.audits.length, 2);
  const data = h.audits[0].data as { action: string; actorUserId: string; metadata: { previous: string[]; granted: string[] } };
  assert.equal(data.action, "STAFF_MANDATES_UPDATED");
  assert.equal(data.actorUserId, "admin");
  assert.equal(JSON.stringify(data.metadata.previous), JSON.stringify(["payments.verify"]));
});
test("unknown privileges and missing reasons cannot update permissions", async () => {
  const h = await harness();
  assert.equal((await h.action(form(["ADMIN"]))).ok, false);
  const data = form(); data.delete("note");
  assert.equal((await h.action(data)).ok, false);
  assert.equal(h.writes.length, 0);
});
