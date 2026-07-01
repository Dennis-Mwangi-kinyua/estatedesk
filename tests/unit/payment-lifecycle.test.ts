import assert from "node:assert/strict";
import test from "node:test";
import { chargeAfterPaymentReversal } from "../../src/lib/payments/lifecycle";
import { buildMpesaTransactionKey } from "../../src/lib/payments/transaction-reference";

test("payment lifecycle preserves uniqueness and unwinds a full allocation", () => {
  const key = buildMpesaTransactionKey("qab12cd34e");
  assert.equal(key, "MPESA:QAB12CD34E");
  const reversed = chargeAfterPaymentReversal({
    amountDue: 15_000,
    amountPaid: 15_000,
    allocationAmount: 15_000,
  });
  assert.deepEqual(reversed, { amountPaid: 0, balance: 15_000, status: "UNPAID" });
});

test("payment reversal preserves other valid allocations", () => {
  assert.deepEqual(
    chargeAfterPaymentReversal({
      amountDue: 20_000,
      amountPaid: 20_000,
      allocationAmount: 8_000,
    }),
    { amountPaid: 12_000, balance: 8_000, status: "PARTIAL" },
  );
});
