import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchStatementRowsToGlLines,
  scoreGlStatementMatch,
} from "../../src/lib/accounting/bank-statement-gl-policy";

describe("GL bank statement matching", () => {
  it("scores exact amount and reference matches highly", () => {
    const score = scoreGlStatementMatch(
      {
        line: 2,
        transactionId: "FT260106ABC",
        amount: 15000,
        paidAt: new Date("2026-03-05T00:00:00.000Z"),
        payerName: "Jane Tenant",
      },
      {
        id: "line-1",
        amount: 15000,
        entryDate: new Date("2026-03-05T00:00:00.000Z"),
        description: "Rent payment FT260106ABC",
        memo: null,
      },
    );

    assert.ok(score > 100);
  });

  it("matches rows to distinct GL lines", () => {
    const result = matchStatementRowsToGlLines(
      [
        {
          line: 2,
          transactionId: "A1",
          amount: 1000,
          paidAt: new Date("2026-03-01T00:00:00.000Z"),
          payerName: "",
        },
        {
          line: 3,
          transactionId: "A2",
          amount: 2000,
          paidAt: new Date("2026-03-02T00:00:00.000Z"),
          payerName: "",
        },
      ],
      [
        {
          id: "gl-1",
          amount: 1000,
          entryDate: new Date("2026-03-01T00:00:00.000Z"),
          description: "Payment A1",
        },
        {
          id: "gl-2",
          amount: 2000,
          entryDate: new Date("2026-03-02T00:00:00.000Z"),
          description: "Payment A2",
        },
      ],
    );

    assert.equal(result.matches.length, 2);
    assert.equal(result.unmatched.length, 0);
  });
});