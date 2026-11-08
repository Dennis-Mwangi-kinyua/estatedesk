import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";

test("feature changes require platform admin authorization and reject unknown keys and malformed values", async () => {
  let allowed = false;
  const updates: unknown[] = [];
  const guard = async (roles: string[]) => {
    assert.deepEqual(roles, ["SUPER_ADMIN", "PLATFORM_ADMIN"]);
    if (!allowed) throw new Error("Denied");
    return { userId: "platform-admin" };
  };
  const update = async (_db: unknown, input: unknown) => { updates.push(input); return { slug: "target" }; };
  const bundle = await build({ entryPoints: ["apps/web/src/app/(app)/platform/feature-flags/actions.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "scope", setup(builder) {
    builder.onResolve({ filter: /^next\/cache$|^@\/lib\/(prisma|permissions\/guards|public-vacancy-cache|org\/update-feature)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "js", contents:
      args.path === "next/cache" ? "export const revalidatePath=()=>{}" :
      args.path.endsWith("/prisma") ? "export const prisma={}" :
      args.path.endsWith("/guards") ? "export const requirePlatformRole=guard" :
      args.path.endsWith("/update-feature") ? "export const updateOrganizationFeature=update" :
      "export const expirePublicVacancies=()=>{}",
    }));
  } }] });
  const mod = { exports: {} as { toggleOrganizationFeatureFlagAction(form: FormData): Promise<void> } };
  new Function("require", "module", "exports", "guard", "update", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports, guard, update);
  const form = (key = "publicVacanciesHidden", value = "true") => { const data = new FormData(); data.set("orgId", "target-org"); data.set("featureKey", key); data.set("nextEnabled", value); return data; };
  await assert.rejects(mod.exports.toggleOrganizationFeatureFlagAction(form()), /Denied/);
  assert.equal(updates.length, 0);
  allowed = true;
  await mod.exports.toggleOrganizationFeatureFlagAction(form("platformRole"));
  await mod.exports.toggleOrganizationFeatureFlagAction(form("taxes", "yes"));
  assert.equal(updates.length, 0);
  await mod.exports.toggleOrganizationFeatureFlagAction(form());
  assert.deepEqual(updates, [{ orgId: "target-org", actorUserId: "platform-admin", key: "publicVacanciesHidden", enabled: true }]);
});
