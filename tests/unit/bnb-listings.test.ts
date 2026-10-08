import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { build } from "esbuild";
import { bnbSchema, parseBnbForm, canManageBnb } from "../../apps/web/src/features/bnb/validation";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";

const valid = { title: "Kilimani sunny apartment", description: "A furnished apartment with a balcony, kitchen, and fast Wi-Fi for a comfortable stay.", location: "Kilimani, Nairobi", address: "", propertyType: "APARTMENT", bedrooms: 1, bathrooms: 1, beds: 1, maxGuests: 2, nightlyRate: 4500, cleaningFee: 500, minimumNights: 1, amenities: ["Wi-Fi"], houseRules: "", contactName: "Jane Host", contactPhone: "+254712345678", contactEmail: "", status: "DRAFT" };
function form(overrides: Record<string, unknown> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...valid, ...overrides })) {
    if (Array.isArray(value)) value.forEach((item) => data.append(key, String(item)));
    else data.set(key, String(value));
  }
  return data;
}
test("BnB posting validates money, guest capacity, amenities, and contact information", () => {
  assert.equal(parseBnbForm(form()).success, true);
  for (const changes of [{ nightlyRate: -1 }, { nightlyRate: 0 }, { nightlyRate: 1.111 }, { cleaningFee: -1 }, { maxGuests: 0 }, { maxGuests: 2.5 }, { bedrooms: -1 }, { bathrooms: 0 }, { minimumNights: 0 }, { amenities: ["unknown"] }, { contactPhone: "javascript:alert(1)" }, { contactEmail: "bad" }, { status: "invalid" }, { description: "short" }]) {
    assert.equal(bnbSchema.safeParse({ ...valid, ...changes }).success, false, JSON.stringify(changes));
  }
  const studio = bnbSchema.parse({ ...valid, bedrooms: 0 });
  assert.equal(studio.bedrooms, 0);
  assert.equal(studio.address, null);
});
test("only admins and managers can use Airbnb routes, including nested editing URLs", () => {
  for (const role of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "TENANT", "LANDLORD"] as const) {
    for (const route of ["/dashboard/org/airbnb", "/dashboard/org/airbnb/new", "/dashboard/org/airbnb/other-org-id/edit"]) {
      assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgId: "org", activeOrgRole: role }, route), canManageBnb(role));
    }
  }
});
async function load<T>(entry: string, mocks: Record<string, string>): Promise<T> {
  const bundle = await build({ entryPoints: [path.resolve(entry)], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "bnb-fixture", setup(builder) {
    builder.onResolve({ filter: /^server-only$/ }, () => ({ path: "empty", namespace: "fixture" }));
    builder.onResolve({ filter: /^(@\/|next\/)/ }, (args) => mocks[args.path] ? { path: args.path, namespace: "fixture" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({ contents: mocks[args.path] ?? "", loader: "js" }));
  } }] });
  const module = { exports: {} as T };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
  return module.exports;
}
test("server actions reject unauthorized roles, cross-org edits, forged photos, and empty publishing", async () => {
  const state = { role: "OFFICE", writes: 0, uploadCalls: 0, existing: null as null | { id: string; slug: string; images: { id: string }[] } };
  (globalThis as typeof globalThis & { bnbFixture?: typeof state }).bnbFixture = state;
  const actions = await load<{ saveBnbAction: (state: object, form: FormData) => Promise<{ error?: string }>; changeBnbStatusAction: (state: object, form: FormData) => Promise<object> }>("apps/web/src/features/bnb/actions.ts", {
    "@/lib/permissions/guards": 'export async function requireOrgRole(roles) { if (!roles.includes(globalThis.bnbFixture.role)) throw Error("Forbidden"); return { activeOrgId: "org", userId: "host" }; }',
    "@/lib/billing/subscription-access": 'export async function requireActiveSubscription() {}',
    "@/lib/prisma": 'export const prisma = { bnbListing: {findFirst: async ({where}) => { if(where.orgId !== "org") throw Error("Unscoped"); return globalThis.bnbFixture.existing; }}, $transaction: async () => { globalThis.bnbFixture.writes++; throw Error("Unexpected write"); } };',
    "@/lib/uploads/image-payload": 'export async function saveImagePayloadAsset() { globalThis.bnbFixture.uploadCalls++; throw Error("Unexpected upload"); }',
    "@/lib/audit/security": 'export async function writeAuditLog() {}',
    "@/lib/errors/server-error-log": 'export function logServerError() {}',
    "next/cache": 'export function revalidatePath() {}',
    "next/navigation": 'export function redirect(url) { throw Error(`Redirect: ${url}`); }',
  });
  for (const role of ["OFFICE", "ACCOUNTANT", "CARETAKER", "TENANT", "LANDLORD"]) {
    state.role = role;
    await assert.rejects(actions.saveBnbAction({}, form()), /Forbidden/);
    await assert.rejects(actions.changeBnbStatusAction({}, form({ id: "foreign-id", status: "PUBLISHED" })), /Forbidden/);
  }
  state.role = "ADMIN";
  assert.match((await actions.saveBnbAction({}, form({ id: "foreign-id" }))).error ?? "", /organization/);
  state.existing = { id: "mine", slug: "mine", images: [{ id: "my-photo" }] };
  const forged = form({ id: "mine" }); forged.append("retainedImages", "someone-elses-photo");
  assert.match((await actions.saveBnbAction({}, forged)).error ?? "", /do not belong/);
  assert.match((await actions.saveBnbAction({}, form({ id: "mine", status: "PUBLISHED" }))).error ?? "", /photo/);
  const invalidPhoto = form(); invalidPhoto.append("photos", new File(["not a real photo"], "fake.jpg", { type: "image/jpeg" }));
  assert.match((await actions.saveBnbAction({}, invalidPhoto)).error ?? "", /genuine/);
  assert.equal(state.writes, 0);
  assert.equal(state.uploadCalls, 0);
  delete (globalThis as typeof globalThis & { bnbFixture?: typeof state }).bnbFixture;
});
test("public listing lookup excludes drafts, paused listings, archived listings, and inactive organizations", async () => {
  const queries = await load<{ publicBnbWhere: object; getPublicBnb: (slug: string) => Promise<{ where: Record<string, unknown> }> }>("apps/web/src/features/bnb/queries.ts", {
    "@/lib/prisma": 'export const prisma = { bnbListing: { findFirst: async (query) => query } };',
  });
  assert.deepEqual(queries.publicBnbWhere, { status: "PUBLISHED", deletedAt: null, org: { status: "ACTIVE", deletedAt: null }, images: { some: { deletedAt: null } } });
  assert.deepEqual((await queries.getPublicBnb("my-stay")).where, { ...queries.publicBnbWhere, slug: "my-stay" });
});

test("successful posting scopes saved data to the active org and attaches uploaded photos", async () => {
  const state = { saved: null as null | { orgId: string; status: string; slug: string; images: { connect: { id: string }[] } }, uploads: 0, audit: 0, refreshed: [] as string[] };
  (globalThis as typeof globalThis & { bnbSaveFixture?: typeof state }).bnbSaveFixture = state;
  const actions = await load<{ saveBnbAction: (state: object, form: FormData) => Promise<object> }>("apps/web/src/features/bnb/actions.ts", {
    "@/lib/permissions/guards": 'export async function requireOrgRole(roles) { if (!roles.includes("MANAGER")) throw Error("Forbidden"); return { activeOrgId: "active-org", userId: "manager" }; }',
    "@/lib/billing/subscription-access": 'export async function requireActiveSubscription(orgId) { if (orgId !== "active-org") throw Error("Unscoped subscription"); }',
    "@/lib/prisma": 'export const prisma = { $transaction: async (fn) => fn({bnbListing: { create: async ({data}) => { globalThis.bnbSaveFixture.saved = data; return {...data, id: "new-listing"}; }}, asset: {count: async () => 1}}) };',
    "@/lib/uploads/image-payload": 'export async function saveImagePayloadAsset(input) { if(input.orgId !== "active-org" || input.submittedByUserId !== "manager") throw Error("Unscoped photo"); globalThis.bnbSaveFixture.uploads++; return "uploaded-photo"; }',
    "@/lib/audit/security": 'export async function writeAuditLog(input) { if(input.orgId !== "active-org") throw Error("Unscoped audit"); globalThis.bnbSaveFixture.audit++; }',
    "@/lib/errors/server-error-log": 'export function logServerError() {}',
    "next/cache": 'export function revalidatePath(url) { globalThis.bnbSaveFixture.refreshed.push(url); }',
    "next/navigation": 'export function redirect(url) { throw Error(`Redirect: ${url}`); }',
  });
  const data = form({ status: "PUBLISHED", orgId: "forged-org" });
  data.append("photos", new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aA8kAAAAASUVORK5CYII=", "base64")], "stay.png", { type: "image/png" }));
  await assert.rejects(actions.saveBnbAction({}, data), /Redirect: \/dashboard\/org\/airbnb\?saved=1/);
  assert.equal(state.saved?.orgId, "active-org");
  assert.equal(state.saved?.status, "PUBLISHED");
  assert.match(state.saved?.slug ?? "", /^kilimani-sunny-apartment-/);
  assert.deepEqual(state.saved?.images.connect, [{ id: "uploaded-photo" }]);
  assert.equal(state.uploads, 1);
  assert.equal(state.audit, 1);
  assert.ok(state.refreshed.includes("/stays"));
  assert.ok(state.refreshed.includes(`/stays/${state.saved?.slug}`));
  delete (globalThis as typeof globalThis & { bnbSaveFixture?: typeof state }).bnbSaveFixture;
});
