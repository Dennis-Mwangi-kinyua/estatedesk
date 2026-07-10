import assert from "node:assert/strict";
import test from "node:test";
import { emptyPaymentInstructions } from "../../apps/web/src/lib/payments/instructions";
import {
  buildCheckoutTransactionKey,
  classifyCheckoutMethod,
  mapCheckoutMethodToPaymentMethod,
  requiresTransactionIdForCheckout,
  validateCheckoutTransactionId,
} from "../../apps/web/src/lib/payments/method-flow";

test("classifies checkout methods correctly", () => {
  assert.equal(classifyCheckoutMethod("mpesa"), "mpesa");
  assert.equal(classifyCheckoutMethod("airtel-money"), "airtel");
  assert.equal(classifyCheckoutMethod("kcb"), "kcb_paybill");
  assert.equal(classifyCheckoutMethod("equity"), "bank");
  assert.equal(classifyCheckoutMethod("family"), "bank");
  assert.equal(classifyCheckoutMethod("coop"), "bank");
});

test("maps all rails to supported Prisma payment methods", () => {
  assert.equal(mapCheckoutMethodToPaymentMethod("mpesa"), "MPESA_MANUAL");
  assert.equal(mapCheckoutMethodToPaymentMethod("kcb"), "MPESA_MANUAL");
  assert.equal(mapCheckoutMethodToPaymentMethod("airtel-money"), "MPESA_MANUAL");
  assert.equal(mapCheckoutMethodToPaymentMethod("equity"), "BANK");
  assert.equal(mapCheckoutMethodToPaymentMethod("family"), "BANK");
});

test("requires a transaction id for every tenant rail", () => {
  for (const method of ["mpesa", "airtel-money", "kcb", "equity", "coop", "family"]) {
    assert.equal(requiresTransactionIdForCheckout(method), true);
  }
});

test("validates M-Pesa and KCB codes strictly", () => {
  assert.equal(validateCheckoutTransactionId("mpesa", "QAB12CD34E").ok, true);
  assert.equal(validateCheckoutTransactionId("kcb", "qab12cd34e").ok, true);
  assert.equal(validateCheckoutTransactionId("mpesa", "SHORT").ok, false);
});

test("validates Airtel and bank references", () => {
  assert.equal(validateCheckoutTransactionId("airtel-money", "AB12CD34EF").ok, true);
  assert.equal(validateCheckoutTransactionId("equity", "TRX-991122").ok, true);
  assert.equal(validateCheckoutTransactionId("equity", "ab").ok, false);
});

test("builds distinct transaction keys per rail", () => {
  const instructions = {
    ...emptyPaymentInstructions,
    kcbAccountNumber: "1234567890",
    airtelNumber: "0712345678",
    bankAccounts: {
      equity: {
        accountName: "Acme",
        accountNumber: "111222",
        branch: "",
        instructions: "",
        businessName: "Equity",
      },
    },
  };

  assert.equal(
    buildCheckoutTransactionKey({
      method: "mpesa",
      transactionId: "QAB12CD34E",
      instructions,
    }),
    "MPESA:QAB12CD34E",
  );
  assert.equal(
    buildCheckoutTransactionKey({
      method: "kcb",
      transactionId: "QAB12CD34E",
      instructions,
    }),
    "BANK:KCB:1234567890:QAB12CD34E",
  );
  assert.equal(
    buildCheckoutTransactionKey({
      method: "equity",
      transactionId: "TRX99",
      instructions,
    }),
    "BANK:EQUITY:111222:TRX99",
  );
});
