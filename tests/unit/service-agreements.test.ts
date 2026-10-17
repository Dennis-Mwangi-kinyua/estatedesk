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
test("organization agreements are available to organization administrators and managers", () => {
  for (const activeOrgRole of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "TENANT", "CARETAKER"] as const) {
    assert.equal(canAccessWorkspacePath({activeOrgRole, activeOrgId: "test-org", platformRole: "USER"}, "/dashboard/org/agreements/example"), activeOrgRole === "ADMIN" || activeOrgRole === "MANAGER");
  }
});

test("new DPA templates allocate organization-caused incidents without excluding processor duties", () => {
  assert.ok(ESTATEDESK_DPA_DRAFT.includes("11. CUSTOMER RESPONSIBILITY AND INDEMNITY"));
  for (const text of ["shall indemnify Afrisilicon Technology Limited", "credential sharing", "does not by itself establish Customer fault", "Afrisilicon's or its subprocessors' breach", "data subject's statutory rights", "not recovered twice", "backup, security, assistance, and recovery duties remain in force"]) assert.ok(ESTATEDESK_DPA_DRAFT.includes(text), text);
});

test("agreement verification permits managers only with an organization context", () => {
  for (const activeOrgRole of ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "TENANT", "CARETAKER"] as const) {
    const session = { activeOrgRole, activeOrgId: "test-org", platformRole: "USER" as const };
    assert.equal(canAccessWorkspacePath(session, "/agreements/verify/example"), ["ADMIN", "MANAGER"].includes(activeOrgRole));
    assert.equal(canAccessWorkspacePath({ ...session, activeOrgId: null }, "/agreements/verify/example"), false);
  }
});
