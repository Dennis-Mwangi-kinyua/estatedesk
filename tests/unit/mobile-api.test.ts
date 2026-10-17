import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isNativeRequest } from "../../apps/web/src/lib/mobile/request-policy";
import { mobileBillsSchema, mobileLoginSchema, mobilePaymentInputSchema, mobileReadingInputSchema } from "../../packages/contracts/src/mobile";

describe("native mobile API boundary", () => {
  it("accepts a native request but does not treat the client header as browser authorization", () => {
    const make = (extra: Record<string, string> = {}) => new Request("https://estatedesk.test/api/mobile/login", {
      headers: { "x-estatedesk-client": "native", ...extra },
    });
    assert.equal(isNativeRequest(make()), true);
    assert.equal(isNativeRequest(new Request("https://estatedesk.test/api/mobile/login")), false);
    assert.equal(isNativeRequest(make({ origin: "https://attacker.test" })), false);
    assert.equal(isNativeRequest(make({ origin: "null" })), false);
    assert.equal(isNativeRequest(make({ origin: "https://estatedesk.test" })), false);
    assert.equal(isNativeRequest(make({ "sec-fetch-site": "same-origin" })), false);
  });

  it("bounds credential input without changing password whitespace", () => {
    const result = mobileLoginSchema.parse({ email: " tenant ", password: " secret " });
    assert.equal(result.email, "tenant");
    assert.equal(result.password, " secret ");
    assert.equal(mobileLoginSchema.safeParse({ email: "", password: "x" }).success, false);
    assert.equal(mobileLoginSchema.safeParse({ email: "a", password: "x".repeat(1025) }).success, false);
  });

  it("rejects malformed bill amounts and strips unrelated database fields", () => {
    const payload = { organizationName: "Example", currencyCode: "KES", totalBalance: 0, bills: [], tenant: { passwordHash: "never-send" } };
    assert.equal("tenant" in mobileBillsSchema.parse(payload), false);
    assert.equal(mobileBillsSchema.safeParse({ ...payload, totalBalance: "100" }).success, false);
  });

  it("rejects invalid meter periods, fractional readings, and imprecise or unsupported payments", () => {
    const reading = { unitId: "unit", period: "2026-10", currentReading: 120 };
    assert.equal(mobileReadingInputSchema.safeParse(reading).success, true);
    assert.equal(mobileReadingInputSchema.safeParse({ ...reading, period: "2026-13" }).success, false);
    assert.equal(mobileReadingInputSchema.safeParse({ ...reading, currentReading: 12.5 }).success, false);
    const payment = { source: "period_bill", id: "2026-10", method: "manual-mpesa", amount: 125.25 };
    assert.equal(mobilePaymentInputSchema.safeParse(payment).success, true);
    for (const amount of [0, -1, 1.001, Infinity]) assert.equal(mobilePaymentInputSchema.safeParse({ ...payment, amount }).success, false);
    assert.equal(mobilePaymentInputSchema.safeParse({ ...payment, method: "unconfigured-gateway" }).success, false);
  });
});
