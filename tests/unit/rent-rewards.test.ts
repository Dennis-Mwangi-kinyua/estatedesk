import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeRentRewards,
  pointsForPayment,
  tierForPoints,
} from "../../apps/web/src/lib/rewards/rent-rewards";

describe("RentRewards loyalty engine", () => {
  it("awards more points for early payments", () => {
    const due = new Date(2026, 5, 5);
    const early = pointsForPayment({
      paidAt: new Date(2026, 5, 1),
      amount: 20000,
      dueDate: due,
      verificationStatus: "VERIFIED",
      gatewayStatus: "SUCCESS",
    });
    const onTime = pointsForPayment({
      paidAt: new Date(2026, 5, 5),
      amount: 20000,
      dueDate: due,
      verificationStatus: "VERIFIED",
      gatewayStatus: "SUCCESS",
    });
    assert.equal(early.kind, "early");
    assert.equal(onTime.kind, "on_time");
    assert.ok(early.points > onTime.points);
  });

  it("builds a snapshot with tier progression", () => {
    const snapshot = computeRentRewards([
      {
        paidAt: new Date(),
        amount: 15000,
        dueDate: new Date(Date.now() + 5 * 86400000),
        verificationStatus: "VERIFIED",
        gatewayStatus: "SUCCESS",
      },
      {
        paidAt: new Date(),
        amount: 15000,
        dueDate: new Date(Date.now() + 4 * 86400000),
        verificationStatus: "VERIFIED",
        gatewayStatus: "SUCCESS",
      },
    ]);
    assert.ok(snapshot.points > 0);
    assert.equal(snapshot.earlyPayments, 2);
    assert.ok(["BRONZE", "SILVER", "GOLD", "PLATINUM"].includes(snapshot.tier));
  });

  it("maps point thresholds to tiers", () => {
    assert.equal(tierForPoints(0), "BRONZE");
    assert.equal(tierForPoints(100), "SILVER");
    assert.equal(tierForPoints(250), "GOLD");
    assert.equal(tierForPoints(500), "PLATINUM");
  });
});
