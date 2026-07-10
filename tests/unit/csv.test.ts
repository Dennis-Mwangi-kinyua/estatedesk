import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCsv, parseCsv } from "../../apps/web/src/lib/csv";

describe("csv utilities", () => {
  it("parses quoted commas, escaped quotes, and blank lines", () => {
    const rows = parseCsv(
      'name,notes,amount\n"Greenview, Block A","Said ""hello""",15000\n\nWestlands,,20000',
    );

    assert.deepEqual(rows, [
      {
        name: "Greenview, Block A",
        notes: 'Said "hello"',
        amount: "15000",
      },
      {
        name: "Westlands",
        notes: "",
        amount: "20000",
      },
    ]);
  });

  it("builds escaped CSV output for report downloads", () => {
    const csv = buildCsv(["tenant", "notes"], [
      { tenant: "Jane", notes: "Paid, early" },
      { tenant: "Ali", notes: 'Needs "review"' },
    ]);

    assert.equal(
      csv,
      'tenant,notes\nJane,"Paid, early"\nAli,"Needs ""review"""',
    );
  });
});
