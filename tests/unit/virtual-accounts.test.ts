import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTenantVirtualAccountRef,
  buildVirtualAccountEndpoints,
  matchTransferToVirtualAccount,
} from "../../apps/web/src/lib/payments/virtual-accounts";

describe("multi-bank virtual account aggregation", () => {
  it("builds endpoints for Equity, KCB, Co-op, I&M and M-Pesa", () => {
    const endpoints = buildVirtualAccountEndpoints({
      mpesaPaybill: "400200",
      kcbPaybillEnabled: true,
      kcbPaybill: "522522",
      equityAccountNumber: "0123456789",
      coopAccountNumber: "011000111",
      imAccountNumber: "100200300",
    });
    const rails = endpoints.map((e) => e.rail).sort();
    assert.deepEqual(rails, ["coop", "equity", "im", "kcb", "mpesa_paybill"].sort());
  });

  it("maps tenant refs and matches bank narrations", () => {
    const ref = buildTenantVirtualAccountRef({
      prefix: "ED",
      unitHouseNo: "A12",
    });
    assert.match(ref, /^EDA12/);
    assert.equal(
      matchTransferToVirtualAccount(`RENT ${ref} JULY`, [ref, "OTHER"]),
      ref,
    );
  });

  it("classifies inbound transfers and maps payment instructions", async () => {
    const { classifyInboundTransfer, endpointsFromPaymentInstructions } =
      await import("../../apps/web/src/lib/payments/virtual-accounts");
    const endpoints = endpointsFromPaymentInstructions({
      mpesaPaybill: "400200",
      bankAccounts: {
        equity: { accountNumber: "012345", accountName: "Ops" },
      },
    });
    assert.ok(endpoints.some((e) => e.rail === "mpesa_paybill"));
    assert.ok(endpoints.some((e) => e.rail === "equity"));

    const classified = classifyInboundTransfer({
      narration: "EQUITY RENT EDA12 JULY",
      amount: 20000,
      knownVirtualRefs: ["EDA12"],
      endpoints,
    });
    assert.equal(classified.matchedRef, "EDA12");
    assert.equal(classified.confidence, "high");
  });
});

