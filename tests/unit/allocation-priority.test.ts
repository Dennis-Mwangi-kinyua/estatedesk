import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyChargeForAllocation,
  compareChargesForAllocation,
  partitionChargesAroundWater,
  sortPeriodBillLinesForDisplay,
  allocationPriorityRank,
} from "../../apps/web/src/lib/billing/allocation-priority";

describe("payment allocation hierarchy", () => {
  it("classifies service, garbage, security, water, and rent buckets", () => {
    assert.equal(classifyChargeForAllocation("SERVICE_CHARGE"), "SERVICE_CHARGE");
    assert.equal(
      classifyChargeForAllocation("OTHER", "Monthly garbage fee"),
      "GARBAGE",
    );
    assert.equal(
      classifyChargeForAllocation("OTHER", "Monthly security fee"),
      "SECURITY",
    );
    assert.equal(classifyChargeForAllocation("WATER"), "WATER");
    assert.equal(classifyChargeForAllocation("RENT"), "RENT");
  });

  it("ranks utilities before rent", () => {
    assert.ok(
      allocationPriorityRank("SERVICE_CHARGE") < allocationPriorityRank("WATER"),
    );
    assert.ok(allocationPriorityRank("WATER") < allocationPriorityRank("RENT"));
    assert.ok(
      allocationPriorityRank("OTHER", "Monthly garbage fee") <
        allocationPriorityRank("RENT"),
    );
  });

  it("sorts charges service → garbage → security → penalty → other → rent", () => {
    const charges = [
      { chargeType: "RENT" as const, description: null },
      { chargeType: "OTHER" as const, description: "Monthly security fee" },
      { chargeType: "SERVICE_CHARGE" as const, description: "Monthly service charge" },
      { chargeType: "OTHER" as const, description: "Monthly garbage fee" },
      { chargeType: "PENALTY" as const, description: null },
    ];
    const sorted = [...charges].sort(compareChargesForAllocation);
    assert.deepEqual(
      sorted.map((c) => classifyChargeForAllocation(c.chargeType, c.description)),
      ["SERVICE_CHARGE", "GARBAGE", "SECURITY", "PENALTY", "RENT"],
    );
  });

  it("partitions rent after water boundary", () => {
    const { beforeWater, rentLast } = partitionChargesAroundWater([
      { chargeType: "RENT", description: null },
      { chargeType: "SERVICE_CHARGE", description: "svc" },
      { chargeType: "OTHER", description: "Monthly garbage fee" },
      { chargeType: "DEPOSIT", description: null },
    ]);
    assert.equal(beforeWater.length, 2);
    assert.equal(rentLast.length, 2);
    assert.ok(beforeWater.every((c) => c.chargeType !== "RENT"));
    assert.ok(rentLast.every((c) => c.chargeType === "RENT" || c.chargeType === "DEPOSIT"));
  });

  it("orders period bill display lines with rent last", () => {
    const lines = sortPeriodBillLinesForDisplay([
      { kind: "RENT", label: "Rent" },
      { kind: "WATER", label: "Water" },
      { kind: "OTHER", label: "Service charge" },
      { kind: "OTHER", label: "Garbage fee" },
    ]);
    assert.deepEqual(
      lines.map((l) => l.label),
      ["Service charge", "Garbage fee", "Water", "Rent"],
    );
  });
});
