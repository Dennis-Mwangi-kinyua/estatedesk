import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canDeactivateAccount,
  normalBalanceForAccountType,
  validateAccountCode,
} from "../../apps/web/src/lib/accounting/accounts";

describe("accounting accounts helpers", () => {
  it("maps normal balances by account type", () => {
    assert.equal(normalBalanceForAccountType("ASSET"), "DEBIT");
    assert.equal(normalBalanceForAccountType("INCOME"), "CREDIT");
  });

  it("validates account codes", () => {
    assert.equal(validateAccountCode("5950"), "5950");
    assert.throws(() => validateAccountCode("bad code"), /3–12 characters/);
  });

  it("protects locked system accounts", () => {
    assert.equal(
      canDeactivateAccount({ systemKey: "BANK", isControl: true }),
      false,
    );
    assert.equal(
      canDeactivateAccount({ systemKey: null, isControl: false }),
      true,
    );
  });
});