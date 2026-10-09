import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Prisma } from "@prisma/client";
import { finalBillingIssues, depositHeldCents } from "../../apps/web/src/lib/move-outs/readiness";
import { financialStatus } from "../../apps/web/src/lib/move-outs/financial-status";
import { calculateSettlement } from "../../apps/web/src/lib/move-outs/settlement";
const lease = { id: "lease", orgId: "org", tenantId: "tenant", unitId: "unit" };
const handover = new Date("2026-10-09T00:00:00+03:00");
function db(overrides = {}) {
  return { paymentAllocation: { findMany: async () => [] }, unit: { findUniqueOrThrow: async () => ({ property: { waterRatePerUnit: 100, waterFixedCharge: 0 } }) }, waterBill: { count: async () => 0, findUnique: async () => ({ tenantId: "tenant", status: "ISSUED" }) }, meterReading: { findUnique: async () => ({ status: "APPROVED", updatedAt: handover }) }, rentCharge: { findUnique: async () => ({ id: "rent" }) }, payment: { count: async () => 0 }, ...overrides } as unknown as Prisma.TransactionClient;
}
describe("move-out readiness and settlement lifecycle", () => {
  it("allows approved final billing and blocks missing final readings", async () => {
    assert.deepEqual(await finalBillingIssues(db(), lease, handover), []);
    const issues = await finalBillingIssues(db({ meterReading: { findUnique: async () => null } }), lease, handover);
    assert.match(issues.join(" "), /final handover meter/);
  });
  it("blocks unposted rent, pending payments, and unresolved utilities", async () => {
    const issues = await finalBillingIssues(db({ rentCharge: { findUnique: async () => null }, payment: { count: async () => 1 }, waterBill: { count: async () => 1, findUnique: async () => ({ status: "PENDING_APPROVAL", tenantId: "tenant" }) } }), lease, handover);
    assert.equal(issues.length, 4);
  });
  it("uses posted deposit credits less offsets and refunds", async () => {
    const value = await depositHeldCents(db({ accountingJournalLine: { findMany: async () => [{ credit: "12000", debit: "0" }, { credit: "0", debit: "2500.25" }] } }), lease);
    assert.equal(value, 949975);
  });
  it("keeps occupancy closure separate from debt payments and refund completion", () => {
    const debt = calculateSettlement(10000, 18000, [{ description: "Repairs", amount: 30 }]);
    assert.equal(debt.amountOwed, 110);
    assert.equal(financialStatus(11000, false), "BALANCE_DUE");
    assert.equal(financialStatus(0, false), "SETTLED");
    assert.equal(financialStatus(0, true), "REFUND_PENDING");
  });
});
