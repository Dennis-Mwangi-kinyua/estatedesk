import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDocumentIdentity,
  documentVerificationPath,
  hashDocumentContent,
} from "../../src/lib/documents/identity";
import { generateReceiptPdf } from "../../src/lib/documents/receipt-pdf";

describe("document trust", () => {
  it("creates readable, type-specific serial numbers and opaque verification codes", () => {
    const identity = createDocumentIdentity(
      "RECEIPT",
      new Date("2026-06-30T12:00:00.000Z"),
      Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    );

    assert.equal(identity.serialNumber, "ED-RCT-2026-ABCDEFGHJK");
    assert.match(identity.verificationCode, /^[A-Za-z0-9_-]{32}$/);
    assert.equal(
      documentVerificationPath("abc/123"),
      "/verify-document/abc%2F123",
    );
  });

  it("hashes document bytes with SHA-256", () => {
    assert.equal(
      hashDocumentContent(Buffer.from("EstateDesk")),
      "cb9eebc68919ccb243dcb4dc9d30dad88eca5bee044c382ac080d895ed665eb6",
    );
  });

  it("generates a stable receipt PDF containing its verification QR", async () => {
    const input = {
      serialNumber: "ED-RCT-2026-ABCDEFGHJK",
      verificationUrl: "https://estatedesk.co.ke/verify-document/test-code",
      status: "ISSUED",
      issuedAt: new Date("2026-06-30T09:00:00.000Z"),
      organizationName: "EstateDesk Demo",
      organizationAddress: "Nairobi, Kenya",
      payerName: "Test Tenant",
      amount: 25_000,
      currencyCode: "KES",
      paymentMethod: "MPESA_STK",
      paymentFor: "RENT",
      paymentReference: "TEST123456",
      paidAt: new Date("2026-06-30T08:30:00.000Z"),
    };

    const first = await generateReceiptPdf(input);
    const second = await generateReceiptPdf(input);

    assert.equal(Buffer.from(first).subarray(0, 5).toString(), "%PDF-");
    assert.ok(first.byteLength > 5_000);
    assert.equal(hashDocumentContent(first), hashDocumentContent(second));
  });
});
