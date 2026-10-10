import assert from "node:assert/strict";
import test from "node:test";
import { emptyPaymentInstructions } from "../../apps/web/src/lib/payments/instructions";
import {
  buildCheckoutTransactionKey,
  classifyCheckoutMethod,
  isMpesaStkConfigured,
  mapCheckoutMethodToPaymentMethod,
  requiresTransactionIdForCheckout,
  validateCheckoutTransactionId,
} from "../../apps/web/src/lib/payments/method-flow";

test("STK credentials are available only to their bound organisation and require a callback", () => {
  const keys = ["MPESA_ORG_ID", "MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_SECRET", "MPESA_CALLBACK_URL"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) process.env[key] = "test-only";
    process.env.MPESA_ORG_ID = "benannabel-test";
    process.env.MPESA_CALLBACK_URL = "https://sandbox.example.test/callback";
    assert.equal(isMpesaStkConfigured("benannabel-test"), true);
    assert.equal(isMpesaStkConfigured("another-org"), false);
    assert.equal(isMpesaStkConfigured(), false);
    delete process.env.MPESA_ORG_ID;
    assert.equal(isMpesaStkConfigured("benannabel-test"), false);
    process.env.MPESA_ORG_ID = "benannabel-test";
    delete process.env.MPESA_CALLBACK_URL;
    assert.equal(isMpesaStkConfigured("benannabel-test"), false);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

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
