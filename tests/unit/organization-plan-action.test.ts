import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";

async function fixture() {
  let authorized = true;
  const revision = new Date("2026-10-22T10:00:00Z");
  const writes: { model: string; args: any }[] = [];
  const current = { id: "subscription", orgId: "org-a", plan: "PRO", updatedAt: revision, metadata: { amountDue: 3000, retained: "keep" } };
  const tx = {
    organization: { findFirst: async ({ where }: any) => where.id === "org-a" ? { slug: "org-a" } : null },
    subscription: { findUnique: async () => current, update: async (args: any) => { writes.push({ model: "subscription", args }); } },
    subscriptionPlanChange: { create: async (args: any) => { writes.push({ model: "history", args }); } },
    auditLog: { create: async (args: any) => { writes.push({ model: "audit", args }); } },
  };
  const db = { $transaction: async (work: (tx: object) => Promise<unknown>) => work(tx) };
  const guard = async (roles: string[]) => { assert.deepEqual(roles, ["SUPER_ADMIN", "PLATFORM_ADMIN"]); if (!authorized) throw new Error("Denied"); return { userId: "platform-admin" }; };
  const bundle = await build({ entryPoints: ["apps/web/src/app/(app)/platform/billing/[orgId]/plan-action.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "plan-action-fixture", setup(builder) {
    builder.onResolve({ filter: /^next\/cache$|^@\/lib\/(prisma|permissions\/guards|billing\/access)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/cache" ? "export const revalidatePath=()=>{};" : args.path.endsWith("/prisma") ? "export const prisma=db;" : args.path.endsWith("/guards") ? "export const requirePlatformRole=guard;" : "export const lockOrgQuota=async()=>{};", loader: "js" }));
  } }] });
  const mod = { exports: {} as typeof import("../../apps/web/src/app/(app)/platform/billing/[orgId]/plan-action") };
  new Function("require", "module", "exports", "db", "guard", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports, db, guard);
  const form = () => { const f = new FormData(); for (const [key, value] of Object.entries({ orgId: "org-a", plan: "ENTERPRISE", revision: revision.toISOString(), propertiesLimit: "7", unitsLimit: "80", usersLimit: "", confirmed: "on" })) f.set(key, value); f.append("allowedViews", "properties"); return f; };
  return { save: mod.exports.saveOrganizationPlan, writes, form, deny: () => { authorized = false; } };
}

test("plan changes require a platform administrator before any write", async () => {
  const f = await fixture(); f.deny();
  await assert.rejects(f.save({}, f.form()), /Denied/);
  assert.equal(f.writes.length, 0);
});
test("organization changes preserve unrelated metadata, audit the operator and do not activate subscriptions", async () => {
  const f = await fixture();
  assert.ok((await f.save({}, f.form())).success);
  const update = f.writes.find(write => write.model === "subscription")!.args;
  assert.deepEqual(update.where, { orgId: "org-a" });
  assert.equal(update.data.metadata.retained, "keep");
  assert.equal(update.data.status, undefined);
  assert.equal(update.data.metadata.organizationPlan.unitsLimit, 80);
  assert.deepEqual(update.data.metadata.organizationPlan.allowedViews, ["properties"]);
  assert.equal(f.writes.find(write => write.model === "audit")!.args.data.actorUserId, "platform-admin");
  assert.equal(f.writes.filter(write => write.model === "history").length, 1);
});
test("stale forms, missing organizations, missing confirmation and malformed limits cannot mutate a subscription", async () => {
  for (const [name, value] of [["revision", "stale"], ["orgId", "org-b"], ["confirmed", ""], ["unitsLimit", "-1"], ["unitsLimit", "2.5"], ["unitsLimit", "1000001"]]) {
    const f = await fixture(); const form = f.form(); form.set(name, value);
    assert.ok((await f.save({}, form)).error, `${name}=${value}`);
    assert.equal(f.writes.length, 0);
  }
});
