import assert from "node:assert/strict";
import test from "node:test";
import {
  isPendingUpgradeRequest,
  parseUpgradeRequest,
} from "../../apps/web/src/lib/billing/upgrade-request-policy";

test("parseUpgradeRequest reads pending request and amount", () => {
  const request = parseUpgradeRequest({
    upgradeRequest: {
      plan: "PRO",
      status: "PENDING",
      amountDue: 3000,
      paymentReference: "QAB12CD34E",
      notes: "Paid via M-Pesa",
      requestedAt: "2026-07-11T10:00:00.000Z",
      requestedByName: "Ada Admin",
    },
  });

  assert.ok(request);
  assert.equal(request?.plan, "PRO");
  assert.equal(request?.status, "PENDING");
  assert.equal(request?.amountDue, 3000);
  assert.equal(request?.paymentReference, "QAB12CD34E");
  assert.equal(isPendingUpgradeRequest({ upgradeRequest: request }), true);
});

test("isPendingUpgradeRequest is false when applied or missing", () => {
  assert.equal(isPendingUpgradeRequest(null), false);
  assert.equal(
    isPendingUpgradeRequest({
      upgradeRequest: { plan: "PRO", status: "APPLIED" },
    }),
    false,
  );
});
