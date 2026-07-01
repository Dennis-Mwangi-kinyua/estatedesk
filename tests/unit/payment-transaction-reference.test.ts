import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBankTransactionKey,
  buildMpesaTransactionKey,
  normalizeTransactionReference,
} from "../../src/lib/payments/transaction-reference";

test("normalizes transaction references consistently", () => {
  assert.equal(normalizeTransactionReference(" qab 12cd34e "), "QAB12CD34E");
});

test("M-Pesa transaction keys are globally stable", () => {
  assert.equal(buildMpesaTransactionKey("qab12cd34e"), "MPESA:QAB12CD34E");
  assert.equal(buildMpesaTransactionKey(" QAB12CD34E "), "MPESA:QAB12CD34E");
});

test("bank transaction keys are scoped to bank account", () => {
  assert.equal(
    buildBankTransactionKey({
      bankName: "KCB Bank",
      accountNumber: "123 456",
      reference: " trn-900 ",
    }),
    "BANK:KCB-BANK:123-456:TRN-900",
  );
});
