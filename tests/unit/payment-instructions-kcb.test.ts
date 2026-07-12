import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_KCB_PAYBILL,
  emptyPaymentInstructions,
  hasAnyPaymentInstructions,
  isKcbPaybillAvailable,
  isPaymentMethodAvailable,
  listAvailablePaymentMethods,
  parsePaymentInstructions,
  resolveEnabledMethods,
} from "../../apps/web/src/lib/payments/instructions";

test("DEFAULT_KCB_PAYBILL is the standard KCB Lipa na M-Pesa business number", () => {
  assert.equal(DEFAULT_KCB_PAYBILL, "522522");
});

test("parsePaymentInstructions reads KCB paybill fields", () => {
  const parsed = parsePaymentInstructions({
    paymentInstructions: {
      enabledMethods: ["kcb"],
      kcbPaybillEnabled: true,
      kcbBusinessName: "Acme Estates",
      kcbPaybill: "522522",
      kcbAccountNumber: "1234567890",
      kcbAccountName: "Acme Estates Ltd",
      kcbInstructions: "Use unit number as narration",
    },
  });

  assert.equal(parsed.kcbPaybillEnabled, true);
  assert.equal(parsed.kcbPaybill, "522522");
  assert.equal(parsed.kcbAccountNumber, "1234567890");
  assert.equal(parsed.kcbBusinessName, "Acme Estates");
  assert.equal(isKcbPaybillAvailable(parsed), true);
  assert.equal(hasAnyPaymentInstructions(parsed), true);
});

test("orgs only expose the payment methods they enable", () => {
  const orgX = parsePaymentInstructions({
    paymentInstructions: {
      enabledMethods: ["mpesa", "kcb", "family"],
      mpesaPaybill: "888888",
      kcbPaybill: "522522",
      kcbAccountNumber: "111",
      bankAccounts: {
        family: {
          accountName: "Org X",
          accountNumber: "999",
          branch: "Nairobi",
          instructions: "",
          businessName: "Family Bank",
        },
      },
    },
  });

  const orgY = parsePaymentInstructions({
    paymentInstructions: {
      enabledMethods: ["coop", "equity"],
      bankAccounts: {
        coop: {
          accountName: "Org Y",
          accountNumber: "222",
          branch: "",
          instructions: "",
          businessName: "Co-op",
        },
        equity: {
          accountName: "Org Y",
          accountNumber: "333",
          branch: "",
          instructions: "",
          businessName: "Equity",
        },
      },
    },
  });

  const xIds = listAvailablePaymentMethods(orgX).map((m) => m.id);
  const yIds = listAvailablePaymentMethods(orgY).map((m) => m.id);

  // Catalog surfaces eCitizen-style rails (STK + manual paste) plus enabled bank ids.
  assert.ok(xIds.includes("mpesa-stk"));
  assert.ok(xIds.includes("manual-mpesa"));
  assert.ok(xIds.includes("kcb"));
  assert.ok(xIds.includes("family"));
  assert.ok(!xIds.includes("equity"));

  // Bank-only orgs still get the generic manual-bank rail alongside named banks.
  assert.ok(yIds.includes("manual-bank"));
  assert.ok(yIds.includes("equity"));
  assert.ok(yIds.includes("coop"));
  assert.ok(!yIds.includes("mpesa-stk"));
  assert.ok(!yIds.includes("manual-mpesa"));
  assert.equal(isPaymentMethodAvailable(orgX, "equity"), false);
  assert.equal(isPaymentMethodAvailable(orgY, "mpesa"), false);
  assert.equal(isPaymentMethodAvailable(orgY, "mpesa-stk"), false);
});

test("legacy flags still resolve enabled methods", () => {
  const legacy = parsePaymentInstructions({
    paymentInstructions: {
      mpesaEnabled: true,
      mpesaPaybill: "123456",
      bankEnabled: true,
      bankName: "Equity Bank",
      bankAccountName: "Acme",
      bankAccountNumber: "555",
    },
  });

  const enabled = resolveEnabledMethods(legacy);
  assert.ok(enabled.includes("mpesa"));
  assert.ok(enabled.includes("equity"));
  assert.equal(isPaymentMethodAvailable(legacy, "mpesa"), true);
  assert.equal(isPaymentMethodAvailable(legacy, "equity"), true);
  assert.equal(isPaymentMethodAvailable(legacy, "coop"), false);
});

test("KCB paybill is unavailable without account number", () => {
  const partial = {
    ...emptyPaymentInstructions,
    enabledMethods: ["kcb"],
    kcbPaybillEnabled: true,
    kcbPaybill: DEFAULT_KCB_PAYBILL,
    kcbAccountNumber: "",
  };
  assert.equal(isKcbPaybillAvailable(partial), false);
});

test("missing KCB fields default to empty / disabled", () => {
  const parsed = parsePaymentInstructions({});
  assert.equal(parsed.kcbPaybillEnabled, false);
  assert.equal(parsed.kcbPaybill, "");
  assert.equal(isKcbPaybillAvailable(parsed), false);
  assert.deepEqual(listAvailablePaymentMethods(parsed), []);
});
