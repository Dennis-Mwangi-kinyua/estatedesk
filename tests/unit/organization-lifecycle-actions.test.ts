import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";

async function fixture() {
  let authorized = true;
  let failure: string | null = null;
  let state = { status: "ACTIVE", sessions: 2, deleted: false, deletedAt: null as Date | null, apiKeys: true, markers: 0 };
  let expired = 0;
  const org = { id: "org-a", slug: "estate-a", name: "Estate A", status: "ACTIVE", deletedAt: null as Date | null };
  const db = {
    organization: { findUnique: async () => ({ ...org, status: state.status, deletedAt: state.deletedAt }) },
    $transaction: async (work: (tx: unknown) => Promise<void>) => {
      const before = { ...state };
      try {
        await work({
          organization: {
            update: async ({ data }: any) => { state.status = data.status; },
            updateMany: async ({ data }: any) => {
              if (failure) throw Object.assign(new Error("Database failure"), { code: failure });
              if (state.deletedAt) return { count: 0 };
              state.status = data.status; state.deletedAt = data.deletedAt;
              return { count: 1 };
            },
            delete: async () => { if (failure) throw Object.assign(new Error("Database failure"), { code: failure }); state.deleted = true; },
          },
          userSession: { updateMany: async () => { state.sessions = 0; } },
          apiKey: { updateMany: async () => { state.apiKeys = false; } },
          auditLog: { create: async () => { state.markers++; } },
        });
      } catch (error) { state = before; throw error; }
    },
  };
  const guard = async (roles: string[]) => {
    assert.deepEqual(roles, ["SUPER_ADMIN", "PLATFORM_ADMIN"]);
    if (!authorized) throw new Error("Denied");
    return { userId: "admin" };
  };
  const bundle = await build({
    entryPoints: ["apps/web/src/app/(app)/platform/organizations/[slug]/actions.ts"],
    bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "lifecycle-fixture", setup(builder) {
      builder.onResolve({ filter: /^next\/(cache|navigation)$|^@\/lib\/(prisma|permissions\/guards|public-vacancy-cache)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents:
        args.path === "next/cache" ? "export const revalidatePath=()=>{};" :
        args.path === "next/navigation" ? "export const redirect=(url)=>{throw new Error(url)};" :
        args.path.endsWith("/prisma") ? "export const prisma=db;" :
        args.path.endsWith("/guards") ? "export const requirePlatformRole=guard;" :
        "export const expirePublicVacancies=expire;", loader: "js" }));
    } }],
  });
  const mod = { exports: {} as typeof import("../../apps/web/src/app/(app)/platform/organizations/[slug]/actions") };
  new Function("require", "module", "exports", "db", "guard", "expire", "console", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports, db, guard, () => { expired++; }, { error() {} });
  const form = () => { const f = new FormData(); Object.entries({ orgId: org.id, expectedSlug: org.slug, confirmation: org.slug, archiveConfirmation: org.slug }).forEach(([k, v]) => f.set(k, v)); return f; };
  return { actions: mod.exports, form, state: () => state, expired: () => expired, deny: () => { authorized = false; }, fail: (code: string) => { failure = code; } };
}

test("organization deactivation clears workspace selection and expires public inventory", async () => {
  const f = await fixture();
  await assert.rejects(f.actions.archiveOrganizationAction(f.form()), /\/platform\/organizations\/estate-a$/);
  assert.deepEqual(f.state(), { status: "DISABLED", sessions: 0, deleted: false, deletedAt: null, apiKeys: true, markers: 0 });
  assert.equal(f.expired(), 1);
});

test("reactivation restores status without clearing sessions", async () => {
  const f = await fixture();
  await assert.rejects(f.actions.reactivateOrganizationAction(f.form()), /\/platform\/organizations\/estate-a$/);
  assert.equal(f.state().status, "ACTIVE");
  assert.equal(f.state().sessions, 2);
  assert.equal(f.expired(), 1);
});

test("deletion retains records, disables access and expires public inventory", async () => {
  const f = await fixture();
  await assert.rejects(f.actions.permanentlyDeleteOrganizationAction(f.form()), /\?deleted=estate-a$/);
  assert.equal(f.state().deleted, false);
  assert.ok(f.state().deletedAt instanceof Date);
  assert.equal(f.state().apiKeys, false);
  assert.equal(f.state().markers, 1);
  const deletedAt = f.state().deletedAt;
  await assert.rejects(f.actions.permanentlyDeleteOrganizationAction(f.form()), /\?deleted=estate-a$/);
  assert.equal(f.state().deletedAt, deletedAt);
  assert.equal(f.state().markers, 1);
  assert.equal(f.state().sessions, 0);
  assert.equal(f.expired(), 2);
});

test("foreign key failures roll back session changes and return a useful deletion error", async () => {
  const f = await fixture(); f.fail("P2003");
  await assert.rejects(f.actions.permanentlyDeleteOrganizationAction(f.form()), error => {
    assert.match(decodeURIComponent((error as Error).message), /deleteError=Unable to delete this organization/); return true;
  });
  assert.deepEqual(f.state(), { status: "ACTIVE", sessions: 2, deleted: false, deletedAt: null, apiKeys: true, markers: 0 });
  assert.equal(f.expired(), 0);
});

test("unauthorized operators and stale or incorrect confirmations cannot change an organization", async () => {
  for (const name of ["archiveOrganizationAction", "reactivateOrganizationAction", "permanentlyDeleteOrganizationAction"] as const) {
    for (const mode of ["denied", "stale", "confirmation"] as const) {
      const f = await fixture(); const form = f.form();
      if (mode === "denied") f.deny();
      if (mode === "stale") form.set("expectedSlug", "old-slug");
      if (mode === "confirmation") { form.set("confirmation", "wrong"); form.set("archiveConfirmation", "wrong"); }
      await assert.rejects(f.actions[name](form));
      assert.deepEqual(f.state(), { status: "ACTIVE", sessions: 2, deleted: false, deletedAt: null, apiKeys: true, markers: 0 });
      assert.equal(f.expired(), 0);
    }
  }
});


test("deleted organizations cannot be reactivated during retention", async () => {
  const f = await fixture();
  await assert.rejects(f.actions.permanentlyDeleteOrganizationAction(f.form()), /\?deleted=estate-a$/);
  await assert.rejects(f.actions.reactivateOrganizationAction(f.form()), error => {
    assert.match(decodeURIComponent((error as Error).message), /Deleted organizations cannot be reactivated/);
    return true;
  });
  assert.equal(f.state().status, "DISABLED");
  assert.ok(f.state().deletedAt);
});
