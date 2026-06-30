import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSmartInsights,
  type SmartInsightSnapshot,
} from "../../src/features/insights/lib/smart-insights";

function healthySnapshot(): SmartInsightSnapshot {
  return {
    collections: { expected: 100_000, paid: 100_000, deficit: 0, defaulted: 0, partial: 0 },
    reconciliation: {
      unreconciled: 0,
      disputed: 0,
      awaitingVerification: 0,
      staleVerification: 0,
      unappliedPayments: 0,
      missingReferences: 0,
    },
    occupancy: { totalUnits: 10, vacantUnits: 0, staleVacancies: 0, monthlyRentAtRisk: 0 },
    maintenance: { openIssues: 0, urgentIssues: 0, staleIssues: 0, unassignedIssues: 0 },
    leases: { expiringIn30Days: 0, expiringIn60Days: 0 },
    water: { pendingReadings: 0, rejectedReadings: 0, unusualReadings: 0 },
  };
}

describe("smart insights", () => {
  it("returns a clean score when there are no operational exceptions", () => {
    const result = buildSmartInsights(healthySnapshot());
    assert.equal(result.score, 100);
    assert.equal(result.collectionRate, 100);
    assert.equal(result.occupancyRate, 100);
    assert.deepEqual(result.recommendations, []);
  });

  it("ranks disputed payments before other recommendations", () => {
    const snapshot = healthySnapshot();
    snapshot.reconciliation.disputed = 2;
    snapshot.collections.defaulted = 3;
    snapshot.collections.paid = 60_000;
    snapshot.collections.deficit = 40_000;

    const result = buildSmartInsights(snapshot);
    assert.equal(result.recommendations[0]?.id, "resolve-payment-disputes");
    assert.equal(result.recommendations[0]?.severity, "CRITICAL");
    assert.ok(result.score < 100);
  });

  it("detects cross-domain actions and keeps rates bounded", () => {
    const snapshot = healthySnapshot();
    snapshot.collections.paid = 140_000;
    snapshot.occupancy.vacantUnits = 4;
    snapshot.occupancy.staleVacancies = 2;
    snapshot.maintenance.urgentIssues = 1;
    snapshot.water.unusualReadings = 1;

    const result = buildSmartInsights(snapshot);
    assert.equal(result.collectionRate, 100);
    assert.equal(result.occupancyRate, 60);
    assert.ok(result.recommendations.some((item) => item.domain === "OCCUPANCY"));
    assert.ok(result.recommendations.some((item) => item.domain === "MAINTENANCE"));
    assert.ok(result.recommendations.some((item) => item.domain === "WATER"));
  });
});
