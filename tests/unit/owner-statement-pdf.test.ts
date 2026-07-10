import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateOwnerStatementPdf } from "../../apps/web/src/lib/documents/owner-statement-pdf";

describe("owner statement pdf", () => {
  it("generates a valid PDF document", async () => {
    const bytes = await generateOwnerStatementPdf({
      organizationName: "Sunrise Property Managers",
      organizationAddress: "Nairobi, Kenya",
      landlordName: "Jane Landlord",
      landlordEmail: "jane@example.com",
      from: new Date("2026-02-01T00:00:00.000Z"),
      to: new Date("2026-02-28T23:59:59.999Z"),
      currencyCode: "KES",
      generatedAt: new Date("2026-03-05T00:00:00.000Z"),
      properties: [
        {
          propertyName: "Sunrise Apartments",
          income: 50000,
          expenses: 5000,
          distributions: 20000,
          netToOwner: 25000,
        },
      ],
      totals: {
        income: 50000,
        expenses: 5000,
        distributions: 20000,
        netToOwner: 25000,
      },
    });

    assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
  });
});