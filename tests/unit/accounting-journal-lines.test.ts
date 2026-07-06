import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseJournalLinesPayload } from "../../src/lib/accounting/journal-lines";

describe("parseJournalLinesPayload", () => {
  it("accepts balanced multi-line journals", () => {
    const lines = parseJournalLinesPayload(
      JSON.stringify([
        { accountId: "a1", debit: 100, credit: 0 },
        { accountId: "a2", debit: 50, credit: 0 },
        { accountId: "a3", debit: 0, credit: 150 },
      ]),
    );

    assert.equal(lines.length, 3);
    assert.equal(lines[0]?.debit, 100);
    assert.equal(lines[2]?.credit, 150);
  });

  it("rejects unbalanced journals", () => {
    assert.throws(
      () =>
        parseJournalLinesPayload(
          JSON.stringify([
            { accountId: "a1", debit: 100, credit: 0 },
            { accountId: "a2", debit: 0, credit: 90 },
          ]),
        ),
      /not balanced/i,
    );
  });
});