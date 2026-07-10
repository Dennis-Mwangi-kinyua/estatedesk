import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPeriodCloseLines } from "../../apps/web/src/lib/accounting/period-close-policy";

describe("period close policy", () => {
  it("builds balanced closing lines to retained earnings", () => {
    const lines = buildPeriodCloseLines(
      [
        {
          accountId: "income-1",
          code: "4000",
          name: "Rental income",
          type: "INCOME",
          balance: 10000,
        },
        {
          accountId: "expense-1",
          code: "5000",
          name: "Repairs",
          type: "EXPENSE",
          balance: 2500,
        },
      ],
      "retained-1",
      "March 2026",
    );

    const debits = lines.reduce((sum, line) => sum + line.debit, 0);
    const credits = lines.reduce((sum, line) => sum + line.credit, 0);
    assert.equal(debits, credits);
    assert.equal(lines.length, 4);
  });
});