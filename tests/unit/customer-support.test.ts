import test from "node:test";
import assert from "node:assert/strict";
import { ticketSchema, replySchema, supportTicketWhere } from "../../apps/web/src/features/customer-support/policy";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";
test("support is personal unless the user is a platform support administrator", () => {
  assert.deepEqual(supportTicketWhere("customer", "USER"), { ownerId: "customer" });
  assert.deepEqual(supportTicketWhere("admin", "PLATFORM_ADMIN"), {});
  assert.deepEqual(supportTicketWhere("admin", "SUPER_ADMIN"), {});
  assert.deepEqual(supportTicketWhere("staff", "DEVELOPER"), { ownerId: "staff" });
  for (const role of ["TENANT", "CARETAKER", "SECURITY", "LANDLORD", "OFFICE", "MANAGER", "ACCOUNTANT", "ADMIN"] as const) {
    assert.equal(canAccessWorkspacePath({ platformRole: "USER", activeOrgId: "org", activeOrgRole: role }, "/dashboard/support/owned-ticket"), true);
  }
});
test("support input is bounded and categories are validated", () => {
  assert.equal(ticketSchema.safeParse({ subject: "Login issue", category: "TECHNICAL", body: "The login page fails to load." }).success, true);
  assert.equal(ticketSchema.safeParse({ subject: "x".repeat(161), category: "TECHNICAL", body: "Description here" }).success, false);
  assert.equal(ticketSchema.safeParse({ subject: "Issue", category: "ADMIN", body: "Description here" }).success, false);
  assert.equal(replySchema.safeParse({ ticketId: "ticket", body: " ".repeat(20) }).success, false);
  assert.equal(replySchema.safeParse({ ticketId: "ticket", body: "x".repeat(4001) }).success, false);
});
