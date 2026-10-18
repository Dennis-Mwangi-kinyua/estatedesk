import test from "node:test";
import assert from "node:assert/strict";
import { mobileInspectionFields, mobileInspectionInputSchema, mobilePaymentReviewInputSchema, mobileVisitorInputSchema } from "../../packages/contracts/src/mobile";
import { mobileFeatures, advertisedMobileFeatures } from "../../apps/web/src/lib/mobile/features";
import { orgViewForPath } from "../../apps/web/src/lib/permissions/org-role-policy";
import { PayloadTooLargeError } from "../../apps/web/src/lib/security/bounded-json";
import { nativeForm } from "../../apps/web/src/lib/mobile/form";
import { mobileReadingInputSchema } from "../../packages/contracts/src/mobile";

test("inspection checks must be explicit and damage needs repair notes", () => {
  const valid = { inspectionId: "inspection", summary: "Checked the whole unit.", recommendations: "", ...Object.fromEntries(mobileInspectionFields.map(f => [f.name, f.name === "damageObserved" ? "no" : "yes"])) };
  assert.equal(mobileInspectionInputSchema.safeParse(valid).success, true);
  assert.equal(mobileInspectionInputSchema.safeParse({ ...valid, cleanlinessOk: undefined }).success, false);
  assert.equal(mobileInspectionInputSchema.safeParse({ ...valid, damageObserved: "yes" }).success, false);
  assert.equal(mobileInspectionInputSchema.safeParse({ ...valid, summary: "x".repeat(2001) }).success, false);
});
test("payment review mandates and view restrictions both apply", () => {
  assert.ok(!mobileFeatures({ activeOrgId: "org", activeOrgRole: "OFFICE" }).includes("payment-review"));
  assert.ok(mobileFeatures({ activeOrgId: "org", activeOrgRole: "OFFICE", grantedPermissions: ["payments.verify"] }).includes("payment-review"));
  assert.ok(!mobileFeatures({ activeOrgId: "org", activeOrgRole: "MANAGER", orgRolePolicy: { permissions: { "payments.verify": "deny" }, blockedViews: [] } }).includes("payment-review"));
  assert.ok(!mobileFeatures({ activeOrgId: "org", activeOrgRole: "ACCOUNTANT", orgRolePolicy: { permissions: {}, blockedViews: ["payments"] } }).includes("payment-review"));
  assert.equal(mobilePaymentReviewInputSchema.safeParse({ id: "payment", action: "verify", note: "" }).success, false);
  assert.equal(mobileVisitorInputSchema.safeParse({ action: "verify", token: "arbitrary-url" }).success, false);
  for (const [path, view] of [["/api/mobile/tenant/documents/receipt/id", "documents"], ["/api/mobile/gate/visitors", "visitors"], ["/api/mobile/caretaker/inspections", "inspections"]]) assert.equal(orgViewForPath(path), view);
});
test("multipart uploads bound streamed bytes and reject duplicate fields or oversized evidence", async () => {
  const make = async (form: FormData) => { const raw = new Request("https://example.test", { method: "POST", body: form }); return new Request("https://example.test", { method: "POST", headers: raw.headers, body: await raw.arrayBuffer() }); };
  await assert.rejects(() => nativeForm(new Request("https://example.test", { method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=broken" }, body: "invalid" }), mobileReadingInputSchema), SyntaxError);
  const form = new FormData(); form.set("unitId", "unit"); form.set("period", "2026-10"); form.set("currentReading", "123");
  assert.equal((await nativeForm(await make(form), mobileReadingInputSchema)).input.currentReading, 123);
  form.append("unitId", "forged"); await assert.rejects(async () => nativeForm(await make(form), mobileReadingInputSchema), SyntaxError);
  form.delete("unitId"); form.set("unitId", "unit"); form.set("photo", new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.png"));
  await assert.rejects(async () => nativeForm(await make(form), mobileReadingInputSchema), SyntaxError);
  form.set("photo", new File([new Uint8Array(3_800_000)], "large.png"));
  await assert.rejects(async () => nativeForm(await make(form), mobileReadingInputSchema), PayloadTooLargeError);
});

test("capability negotiation keeps older installed mobile clients working", () => {
  const features = mobileFeatures({ activeOrgId: "org", activeOrgRole: "TENANT" });
  assert.deepEqual(advertisedMobileFeatures(features, null), ["leases", "move-outs"]);
  assert.deepEqual(advertisedMobileFeatures(features, "unknown"), ["leases", "move-outs"]);
  assert.deepEqual(advertisedMobileFeatures(features, "2026-10-18"), features);
});
