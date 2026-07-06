import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateOwnerStatementRows,
  ownerStatementTotals,
} from "../../src/lib/accounting/owner-statement-policy";

describe("owner statement policy", () => {
  it("aggregates income, expenses, and distributions by property", () => {
    const rows = aggregateOwnerStatementRows([
      {
        propertyId: "p1",
        propertyName: "Sunrise Apartments",
        accountType: "INCOME",
        systemKey: "RENT_INCOME",
        sourceType: "PAYMENT",
        debit: 0,
        credit: 50000,
      },
      {
        propertyId: "p1",
        propertyName: "Sunrise Apartments",
        accountType: "EXPENSE",
        systemKey: "REPAIRS_EXPENSE",
        sourceType: "MANUAL",
        debit: 5000,
        credit: 0,
      },
      {
        propertyId: "p1",
        propertyName: "Sunrise Apartments",
        accountType: "ASSET",
        systemKey: "BANK",
        sourceType: "OWNER_DISTRIBUTION",
        debit: 0,
        credit: 20000,
      },
      {
        propertyId: "p2",
        propertyName: "Lakeview House",
        accountType: "INCOME",
        systemKey: "RENT_INCOME",
        sourceType: "PAYMENT",
        debit: 0,
        credit: 30000,
      },
    ]);

    assert.equal(rows.length, 2);
    const sunrise = rows.find((row) => row.propertyName === "Sunrise Apartments");
    assert.equal(sunrise?.income, 50000);
    assert.equal(sunrise?.expenses, 5000);
    assert.equal(sunrise?.distributions, 20000);
    assert.equal(sunrise?.netToOwner, 25000);

    const totals = ownerStatementTotals(rows);
    assert.equal(totals.netToOwner, 55000);
  });
});