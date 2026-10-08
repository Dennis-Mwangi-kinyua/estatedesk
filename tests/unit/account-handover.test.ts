import assert from "node:assert/strict";
import { test } from "node:test";
import { accountHandoverText, accountShareUrl } from "../../apps/web/src/app/(app)/platform/organizations/new/_lib/account-handover";
import { validateAccountStep } from "../../apps/web/src/app/(app)/platform/organizations/new/_lib/form-validation";

const account = { organizationName: "Example & Partners", slug: "example", accountType: "LANDLORD", fullName: "Jane", username: "jane", email: "jane@example.test", phone: null, plan: "FREE" };
test("handover omits a password unless explicitly included", () => {
  const text = accountHandoverText(account, "https://example.test/login");
  assert.ok(!text.includes("Temporary password:"));
  assert.ok(accountHandoverText(account, "https://example.test/login", "secret123").includes("Temporary password: secret123"));
});
test("sharing drafts encode message content and normalize phone numbers", () => {
  const text = "Hello & welcome\nEmail: jane@example.test";
  assert.equal(accountShareUrl("whatsapp", text, account.email, "+254 700-000-000"), `https://wa.me/254700000000?text=${encodeURIComponent(text)}`);
  assert.equal(new URL(accountShareUrl("email", text, account.email, "")).searchParams.get("body"), text);
  assert.ok(accountShareUrl("sms", text, "", "+254 700-000-000").startsWith("sms:+254700000000?body="));
});
test("step validation explains missing or invalid owner details", () => {
  const errors = validateAccountStep(2, { adminFullName: "", adminUsername: "bad user", adminEmail: "invalid", adminPassword: "short", adminPasswordConfirm: "different" });
  assert.equal(Object.keys(errors).length, 5);
  assert.deepEqual(validateAccountStep(2, { adminFullName: "Jane Example", adminUsername: "jane.example", adminEmail: "jane@example.test", adminPassword: "valid-password", adminPasswordConfirm: "valid-password" }), {});
});
