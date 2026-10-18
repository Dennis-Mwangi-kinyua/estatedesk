import test from "node:test";
import assert from "node:assert/strict";
import { mobileSessionSchema } from "../../packages/contracts/src/mobile";
import { nativeTenantDestination } from "../../apps/mobile/src/native-tenant-navigation";
const session = mobileSessionSchema.parse({ fullName: "Tenant", role: "TENANT", organizationName: "Example", requiresAccountSetup: false, features: ["leases", "move-outs", "documents", "visitors"] });
test("core tenant destinations resolve to native workflows", () => {
  for (const [route, screen] of [["community", "community"], ["expenditures", "expenditures"], ["payments", "bills"], ["water-bills", "water-bills"], ["invoice", "invoices"], ["lease", "leases"], ["history", "history"], ["notices", "move-outs"], ["profile", "profile"], ["help", "help"], ["documents", "documents"], ["visitors", "visitors"]]) {
    assert.equal(nativeTenantDestination(`/dashboard/tenant/${route}`, session), screen);
  }
});
test("native routing respects advertised billing and feature capabilities", () => {
  const restricted = { ...session, canViewBills: false, features: [] };
  for (const route of ["payments", "water-bills", "invoice", "lease", "notices", "documents", "visitors"]) assert.equal(nativeTenantDestination(`/dashboard/tenant/${route}`, restricted), null);
});
test("unconverted routes never resolve to a different native workflow", () => {
  for (const route of ["/dashboard/security", "/dashboard/tenant/rewards", "https://external.test", "/dashboard/tenant/invoice/2026-10/download"]) assert.equal(nativeTenantDestination(route, session), null);
});
