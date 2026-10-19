import test from "node:test";
import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { PDFDocument } from "pdf-lib";
import { base64, signaturePng } from "../../apps/mobile/src/signature-image";
import { inspectionPhotos } from "../../apps/web/src/lib/mobile/inspection-photos";
import type { NativeActionDefinition } from "../../packages/contracts/src/mobile";

async function load(file: string, mocks: Record<string, string> = {}) {
  const bundle = await build({ entryPoints: [file], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "functional-gap-fixtures", setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: "fixture" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js" }));
  } }] });
  const mod = { exports: {} as Record<string, (...args: any[]) => any> };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports);
  return mod.exports;
}
test("native drawn signatures produce a bounded decodable PNG and preserve actual strokes", async () => {
  const png = signaturePng([[{ x: 0.1, y: 0.2 }, { x: 0.8, y: 0.7 }]]);
  assert.ok(png.length < 256 * 1024);
  assert.deepEqual(Buffer.from(base64(png), "base64"), Buffer.from(png));
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(png);
  assert.equal(image.width, 480); assert.equal(image.height, 160);
  const idatLength = Buffer.from(png).readUInt32BE(33);
  const raster = inflateSync(png.subarray(41, 41 + idatLength));
  assert.equal(raster.length, 481 * 160);
  assert.ok(raster.includes(30)); assert.ok(raster.includes(255));
  assert.throws(() => signaturePng([]), /Draw/);
  assert.throws(() => signaturePng([[{ x: NaN, y: 0 }, { x: 1, y: 1 }]]), /Invalid/);
  assert.throws(() => signaturePng([Array.from({ length: 2001 }, () => ({ x: 0, y: 0 }))]), /fewer/);
});
test("drawn and uploaded signatures use the web image validator and reject fake or missing images", async () => {
  const mod = await load("apps/web/src/lib/mobile/signature.ts");
  const signatureData = `data:image/png;base64,${base64(signaturePng([[{ x: 0, y: 0 }, { x: 1, y: 1 }]]))}`;
  for (const signatureMethod of ["DRAWN", "UPLOADED"]) {
    const result = await mod.nativeSignature({ signatureMethod, signatureData });
    assert.equal(result.method, signatureMethod); assert.ok(result.bytes.length > 0); assert.ok(result.imageHash);
  }
  assert.equal((await mod.nativeSignature({})).method, "TYPED");
  await assert.rejects(() => mod.nativeSignature({ signatureMethod: "DRAWN" }), /signature/i);
  await assert.rejects(() => mod.nativeSignature({ signatureMethod: "UPLOADED", signatureData: "data:image/png;base64,aGVsbG8=" }), /Signature/);
  await assert.rejects(() => mod.nativeSignature({ signatureMethod: "FORGED" }), /signature/i);
});
test("inspection evidence only contains explicit room/check-in photo references", () => {
  assert.deepEqual(inspectionPhotos(null), []);
  assert.deepEqual(inspectionPhotos({ roomPhotos: { livingRoom: "photo", ignored: false }, checkIn: { photoAssetId: "check-in" }, unrelatedAsset: "secret" }), [{ id: "photo", label: "living Room" }, { id: "check-in", label: "Site check-in" }]);
  assert.equal(inspectionPhotos({ roomPhotos: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [String(i), String(i)])) }).length, 32);
});
test("native form drafts recover entries without persisting credentials, signatures, consent or stale versions", async () => {
  const memory = new Map<string, string>();
  const fixture = globalThis as typeof globalThis & { __formDraftMemory?: Map<string, string> };
  fixture.__formDraftMemory = memory;
  const mod = await load("apps/mobile/src/form-drafts.ts", {
    "expo-secure-store": `export const WHEN_UNLOCKED_THIS_DEVICE_ONLY='private';export const getItemAsync=async k=>globalThis.__formDraftMemory.get(k)??null;export const setItemAsync=async(k,v)=>{globalThis.__formDraftMemory.set(k,v)};export const deleteItemAsync=async k=>{globalThis.__formDraftMemory.delete(k)};`,
    "expo-crypto": `import {createHash,randomUUID} from 'node:crypto';export {randomUUID};export const CryptoDigestAlgorithm={SHA256:'sha256'};export const digestStringAsync=async(_,s)=>createHash('sha256').update(s).digest('hex');`,
  });
  const definition: NativeActionDefinition = { id: "unit.edit", title: "Edit", description: "", confirmation: "Save?", submitLabel: "Save", groups: [{ id: "details", title: "Details", fields: [
    { name: "name", label: "Name", type: "text" }, { name: "password", label: "Password", type: "password" }, { name: "signature", label: "Signature", type: "signature" }, { name: "consent", label: "Consent", type: "checkbox" }, { name: "expectedUpdatedAt", label: "Version", type: "hidden", defaultValue: "current" },
  ] }] };
  const request = { kind: "organization", path: "/dashboard/org/units", actionId: "unit.edit", recordId: "unit" };
  const profile = { userId: "user", fullName: "User", organizationId: "org", organizationName: "Org", role: "ADMIN", platformRole: "USER", requiresAccountSetup: false };
  try {
    memory.set("estatedesk.profile", JSON.stringify(profile));
    const key = await mod.formDraftKey(request);
    await mod.saveFormDraft(key, definition, { values: { name: "Unfinished unit", password: "SECRET", signature: "PRIVATE-IMAGE", consent: "on", expectedUpdatedAt: "forged" }, rows: {}, version: "forged" });
    const draft = await mod.loadFormDraft(key);
    assert.deepEqual(draft.values, { name: "Unfinished unit" });
    assert.equal(draft.version, mod.formDraftVersion(definition));
    assert.ok(!JSON.stringify([...memory]).includes("SECRET")); assert.ok(!JSON.stringify([...memory]).includes("PRIVATE-IMAGE"));
    memory.set("estatedesk.profile", JSON.stringify({ ...profile, organizationId: "other" }));
    const other = await mod.formDraftKey(request); assert.notEqual(other, key); assert.equal(await mod.loadFormDraft(other), null);
    await mod.clearFormDrafts();
    assert.equal(await mod.loadFormDraft(key), null);
    await assert.rejects(() => mod.saveFormDraft(key, definition, { values: {}, rows: {}, version: "" }), /account changed/);
  } finally { delete fixture.__formDraftMemory; }
});

test("native inventory edits retain role, unit scope and the reviewed version", async () => {
  const fixture = { queries: [] as unknown[], saves: [] as unknown[], row: { id: "unit", houseNo: "A1", updatedAt: new Date("2026-10-18T00:00:00Z"), type: "APARTMENT", rentAmount: 15000, hasBalcony: true, property: { name: "Property" } } as object | null };
  const globalFixture = globalThis as typeof globalThis & { __inventoryFixture?: typeof fixture };
  globalFixture.__inventoryFixture = fixture;
  const mod = await load("apps/web/src/lib/mobile/native-inventory-actions.ts", {
    "server-only": "",
    "@/lib/prisma": `export const prisma={unit:{findFirst:async args=>{globalThis.__inventoryFixture.queries.push(args);return globalThis.__inventoryFixture.row}}};`,
    "@/app/(app)/dashboard/org/units/[unitId]/unit-profile-actions": `export const updateUnitProfileAction=async(id,_,form)=>{globalThis.__inventoryFixture.saves.push({id,values:Object.fromEntries(form)});return {message:'Unit saved'}};`,
  });
  const session = { activeOrgId: "org", activeOrgRole: "MANAGER", membershipScope: { scopeType: "UNIT", scopeId: "assigned" } };
  try {
    assert.equal(await mod.nativeInventoryDefinition({ ...session, activeOrgRole: "OFFICE" }, "/dashboard/org/units", "unit.edit", "unit"), null);
    assert.equal(fixture.queries.length, 0);
    const definition = await mod.nativeInventoryDefinition(session, "/dashboard/org/units", "unit.edit", "unit") as NativeActionDefinition;
    assert.equal(definition.groups[0].fields.find(field => field.name === "expectedUpdatedAt")?.defaultValue, "2026-10-18T00:00:00.000Z");
    const query = fixture.queries[0] as { where: { AND: Record<string, unknown>[] } };
    assert.equal(query.where.AND[0].id, "assigned"); assert.equal(query.where.AND[1].id, "unit");
    assert.match(JSON.stringify(query), /"orgId":"org"/);
    const form = new FormData(); form.set("expectedUpdatedAt", "reviewed-version");
    await mod.executeNativeInventoryAction(session, "/dashboard/org/units", "unit.edit", "unit", form);
    assert.deepEqual(fixture.saves, [{ id: "unit", values: { expectedUpdatedAt: "reviewed-version" } }]);
    fixture.row = null;
    assert.ok((await mod.executeNativeInventoryAction(session, "/dashboard/org/units", "unit.edit", "other", form)).error);
    assert.equal(fixture.saves.length, 1);
  } finally { delete globalFixture.__inventoryFixture; }
});

test("inspection photo reads require tenant ownership, an explicit checklist reference and a matching unit asset", async () => {
  const fixture = { inspection: { checklist: { roomPhotos: { kitchen: "photo" } }, notice: { lease: { unitId: "unit" } } } as object | null, asset: { key: "private-key", mimeType: "image/png", size: 80000 } as object | null, queries: [] as { model: string; args: unknown }[], reads: 0, allowed: true };
  const globalFixture = globalThis as typeof globalThis & { __inspectionPhotoFixture?: typeof fixture };
  globalFixture.__inspectionPhotoFixture = fixture;
  const png = signaturePng([[{ x: 0, y: 0 }, { x: 1, y: 1 }]]);
  const mod = await load("apps/web/src/app/api/mobile/tenant/inspections/[inspectionId]/photos/[assetId]/route.ts", {
    "@/lib/mobile/route": `export const nativeRoute=async(req,handler)=>handler({userId:'tenant',activeOrgId:'org'});`,
    "@/lib/mobile/tenant-section": `export const nativeTenantSection=async()=>globalThis.__inspectionPhotoFixture.allowed;`,
    "@/lib/mobile/api": `export const mobileJson=(body,status=200)=>Response.json(body,{status});`,
    "@/lib/prisma": `export const prisma=new Proxy({}, {get(_,model){return {findFirst:async args=>{const f=globalThis.__inspectionPhotoFixture;f.queries.push({model,args});return f[model]}}}});`,
    "@/lib/storage/read-asset-bytes": `export const readAssetBytes=async()=>{globalThis.__inspectionPhotoFixture.reads++;return new Uint8Array(${JSON.stringify([...png])})};`,
  });
  const get = (assetId = "photo") => mod.GET(new Request("https://example.test/api/mobile/tenant/inspections/inspection/photos/photo"), { params: Promise.resolve({ inspectionId: "inspection", assetId }) });
  try {
    let response = await get(); assert.equal(response.status, 200); assert.match((await response.json()).dataUri, /^data:image\/png;base64,/);
    assert.match(JSON.stringify(fixture.queries[0]), /"userId":"tenant"/); assert.match(JSON.stringify(fixture.queries[0]), /"orgId":"org"/);
    assert.match(JSON.stringify(fixture.queries[1]), /"unitId":"unit"/);
    assert.equal((await get("unrelated-photo")).status, 404); assert.equal(fixture.reads, 1);
    fixture.inspection = null; assert.equal((await get()).status, 404); assert.equal(fixture.reads, 1);
    fixture.allowed = false; response = await get(); assert.equal(response.status, 403); assert.equal(fixture.reads, 1);
  } finally { delete globalFixture.__inspectionPhotoFixture; }
});
