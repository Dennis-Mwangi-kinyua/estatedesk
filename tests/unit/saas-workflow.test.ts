import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dueDateForPeriod, isBillingPeriod, nairobiDayStart, nairobiMonthStart } from "../../apps/web/src/lib/billing/period-dates";
import { unremindedTenantArrears } from "../../apps/web/src/lib/workflow/arrears-queue";
import {
  computeSaasMetrics,
  formatMetricDays,
  formatMetricHours,
  formatMetricShare,
} from "../../apps/web/src/lib/workflow/saas-metrics";
import { buildSetupSteps, type SetupCounts } from "../../apps/web/src/lib/workflow/setup-progress";

const emptyCounts: SetupCounts = {
  properties: 0,
  buildings: 0,
  units: 0,
  tenants: 0,
  leases: 0,
  rentCharges: 0,
  meterReadings: 0,
  tenantLogins: 0,
  staffMemberships: 1,
  invitations: 0,
};

describe("billing period dates", () => {
  it("accepts a calendar month and rejects other text", () => {
    assert.equal(isBillingPeriod("2026-02"), true);
    assert.equal(isBillingPeriod("2026-13"), false);
    assert.equal(isBillingPeriod("2026-2"), false);
    assert.equal(isBillingPeriod("February"), false);
  });

  it("clamps the due day to the last day of the month", () => {
    assert.equal(dueDateForPeriod("2026-02", 31).getDate(), 28);
    assert.equal(dueDateForPeriod("2024-02", 31).getDate(), 29);
    assert.equal(dueDateForPeriod("2026-04", 5).getDate(), 5);
    assert.equal(dueDateForPeriod("2026-04", 0).getDate(), 1);
  });

  it("starts the Nairobi day and month at 00:00 East Africa Time", () => {
    const evening = new Date("2026-06-01T22:30:00.000Z");
    assert.equal(nairobiDayStart(evening).toISOString(), "2026-06-01T21:00:00.000Z");
    assert.equal(nairobiMonthStart(evening).toISOString(), "2026-05-31T21:00:00.000Z");
  });
});

describe("workspace setup steps", () => {
  it("stays open until a rent charge exists and does not require a building", () => {
    const started = buildSetupSteps({ ...emptyCounts, properties: 1, units: 2 }, "unit-1");
    assert.equal(started.complete, false);
    assert.equal(started.steps[0]?.done, true);
    assert.equal(started.steps[1]?.href, "/dashboard/org/tenants/new?unitId=unit-1");

    const billed = buildSetupSteps({ ...emptyCounts, properties: 1, units: 1, tenants: 1, leases: 1, rentCharges: 1, tenantLogins: 1 }, null);
    assert.equal(billed.complete, true);
    assert.equal(billed.steps.find((step) => step.id === "team")?.done, false);
    assert.equal(billed.steps.find((step) => step.id === "team")?.href, "/dashboard/org/staff");
  });

  it("marks the team step done once a tenant can sign in and another person is invited", () => {
    const ready = buildSetupSteps({
      ...emptyCounts,
      properties: 1,
      units: 1,
      tenants: 1,
      leases: 1,
      rentCharges: 1,
      tenantLogins: 1,
      invitations: 1,
    }, null);
    assert.equal(ready.steps.every((step) => step.done), true);
  });

  it("asks a free workspace to invite an office user", () => {
    const free = buildSetupSteps({ ...emptyCounts, properties: 1, units: 1 }, null, { free: true });
    assert.equal(
      free.steps.find((step) => step.id === "team")?.detail,
      "The tenant form creates their login. Invite one office user so the bill is not only yours.",
    );
    const paid = buildSetupSteps(emptyCounts, null);
    assert.equal(
      paid.steps.find((step) => step.id === "team")?.detail,
      "The tenant form creates their login. Invite one office or caretaker user so the queue is not only yours.",
    );
  });
});

describe("unreminded arrears", () => {
  it("counts each tenant once from the oldest charge and skips tenants already reminded", () => {
    const result = unremindedTenantArrears([
      { id: "a", tenantId: "t1", dueDate: new Date("2026-01-01") },
      { id: "b", tenantId: "t1", dueDate: new Date("2026-02-01") },
      { id: "c", tenantId: "t2", dueDate: new Date("2026-03-01") },
      { id: "d", tenantId: "t3", dueDate: new Date("2026-04-01") },
    ], new Set(["t3"]));
    assert.equal(result.total, 2);
    assert.deepEqual(result.items.map((item) => item.id), ["a", "c"]);
  });
});

describe("workspace pace metrics", () => {
  const created = new Date("2026-06-01T00:00:00.000Z");
  const firstUnit = new Date("2026-06-01T05:00:00.000Z");
  const firstBill = new Date("2026-06-03T00:00:00.000Z");
  const now = new Date("2026-06-20T00:00:00.000Z");

  it("measures signup, auto settlement, and bills reconciled within seven days", () => {
    const metrics = computeSaasMetrics({
      organizationCreatedAt: created,
      firstUnitAt: firstUnit,
      firstChargeAt: firstBill,
      payments: [
        { method: "MPESA_STK", verificationStatus: "NOT_REQUIRED", gatewayStatus: "SUCCESS", count: 3 },
        { method: "MPESA_STK", verificationStatus: "PENDING", gatewayStatus: "SUCCESS", count: 4 },
        { method: "CASH", verificationStatus: "PENDING", gatewayStatus: "SUCCESS", count: 1 },
        { method: "BANK", verificationStatus: "VERIFIED", gatewayStatus: "SUCCESS", count: 9 },
      ],
      charges: [
        { createdAt: new Date("2026-06-01T00:00:00.000Z"), updatedAt: new Date("2026-06-04T00:00:00.000Z"), balance: 0, status: "PAID" },
        { createdAt: new Date("2026-06-01T00:00:00.000Z"), updatedAt: new Date("2026-06-12T00:00:00.000Z"), balance: 0, status: "PAID" },
        { createdAt: new Date("2026-06-01T00:00:00.000Z"), updatedAt: new Date("2026-06-02T00:00:00.000Z"), balance: 0, status: "WAIVED" },
        { createdAt: new Date("2026-06-18T00:00:00.000Z"), updatedAt: new Date("2026-06-18T00:00:00.000Z"), balance: 1000, status: "UNPAID" },
        { createdAt: new Date("2026-06-01T00:00:00.000Z"), updatedAt: new Date("2026-06-01T00:00:00.000Z"), balance: 1000, status: "UNPAID" },
      ],
      now,
      chargeSampleLimited: true,
    });

    assert.equal(metrics.hoursSignupToFirstUnit, 5);
    assert.equal(metrics.daysFirstUnitToFirstBill, 1.8);
    assert.equal(metrics.settledWithoutReview, 3);
    assert.equal(metrics.pendingProofs, 1);
    assert.equal(metrics.autoSettledShare, 0.75);
    assert.equal(metrics.eligibleBills, 4);
    assert.equal(metrics.reconciledWithinSevenDays, 1);
    assert.equal(metrics.reconciledWithinSevenDaysShare, 0.25);
    assert.equal(metrics.chargeSampleLimited, true);
    assert.equal(formatMetricShare(metrics.autoSettledShare), "75%");
    assert.equal(formatMetricHours(metrics.hoursSignupToFirstUnit), "5 hours");
    assert.equal(formatMetricDays(0.4), "Same day");
  });

  it("reports not yet when the organisation has no unit, bill, or comparable payment", () => {
    const metrics = computeSaasMetrics({
      organizationCreatedAt: created,
      firstUnitAt: null,
      firstChargeAt: null,
      payments: [],
      charges: [],
      now,
    });
    assert.equal(metrics.hoursSignupToFirstUnit, null);
    assert.equal(metrics.daysFirstUnitToFirstBill, null);
    assert.equal(metrics.autoSettledShare, null);
    assert.equal(metrics.reconciledWithinSevenDaysShare, null);
    assert.equal(formatMetricHours(null), "Not yet");
    assert.equal(formatMetricHours(0.2), "Under 1 hour");
    assert.equal(formatMetricDays(null), "Not yet");
    assert.equal(formatMetricShare(null), "Not yet");
  });
});
