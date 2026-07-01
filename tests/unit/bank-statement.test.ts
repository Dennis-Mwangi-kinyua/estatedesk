import assert from "node:assert/strict";
import test from "node:test";
import { parseBankStatement } from "../../src/lib/payments/bank-statement";

test("parses and normalizes bank statement rows", () => {
  const [row] = parseBankStatement(
    "transactionId,amount,paidAt,payerName\n trn 001 ,15000,2026-06-30,Jane",
  );
  assert.equal(row.transactionId, "TRN001");
  assert.equal(row.amount, 15000);
  assert.equal(row.payerName, "Jane");
});

test("rejects incomplete bank statement rows", () => {
  assert.throws(
    () => parseBankStatement("transactionId,amount,paidAt\n,0,nope"),
    /transactionId is required/,
  );
});
