import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { agreementTemplate, signatureName, ESTATEDESK_DPA_DRAFT } from "../../apps/web/src/lib/service-agreements/contract";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";

test("agreement schedules and legal parties are included in the exact signed text", () => {
  const input = {organization: "Customer Legal Ltd", provider: "Afrisilicon Technology Limited, trading as EstateDesk", contact: "privacy@example.test", representative: "A Representative", services: "Service plan and support schedule", infrastructure: "Provider, locations, transfer safeguards and security", retention: "Agreed export, deletion and backup-retention schedule"};
  const body = agreementTemplate(input);
  for (const value of Object.values(input)) assert.ok(body.includes(value));
  const hash = (text: string) => createHash("sha256").update(text).digest("hex");
  assert.notEqual(hash(body), hash(agreementTemplate({...input, retention: "A changed retention schedule"})));
  assert.ok(ESTATEDESK_DPA_DRAFT.includes("UNSIGNED TEMPLATE"));
  assert.ok(ESTATEDESK_DPA_DRAFT.includes("privacy and incident contact email — required before signing"));
});
test("typed signatures must match the authenticated person's full name", () => {
  assert.equal(signatureName("  Mary  Wanjiku ", "Mary Wanjiku"), true);
  assert.equal(signatureName("mary wanjiku", "Mary Wanjiku"), true);
  assert.equal(signatureName("Another Person", "Mary Wanjiku"), false);
});
test("organization agreements are available only to organization administrators", () => {
  for (const activeOrgRole of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "TENANT", "CARETAKER"] as const) {
    assert.equal(canAccessWorkspacePath({activeOrgRole, activeOrgId: "test-org", platformRole: "USER"}, "/dashboard/org/agreements/example"), activeOrgRole === "ADMIN");
  }
});
