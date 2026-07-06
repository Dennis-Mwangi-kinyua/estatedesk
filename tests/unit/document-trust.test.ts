import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDocumentIdentity,
  documentVerificationPath,
  hashDocumentContent,
} from "../../src/lib/documents/identity";
import { generateVerifiedLeasePdf } from "../../src/lib/documents/lease-verification-pdf";
import { generateReceiptPdf } from "../../src/lib/documents/receipt-pdf";
import { PDFDocument } from "pdf-lib";

describe("document trust", () => {
  it("creates readable, type-specific serial numbers and opaque verification codes", () => {
    const receiptIdentity = createDocumentIdentity(
      "RECEIPT",
      new Date("2026-06-30T12:00:00.000Z"),
      Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    );
    const leaseIdentity = createDocumentIdentity(
      "LEASE",
      new Date("2026-06-30T12:00:00.000Z"),
      Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    );

    assert.equal(receiptIdentity.serialNumber, "ED-RCT-2026-ABCDEFGHJK");
    assert.equal(leaseIdentity.serialNumber, "ED-LSE-2026-ABCDEFGHJK");
    assert.match(receiptIdentity.verificationCode, /^[A-Za-z0-9_-]{32}$/);
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

  it("generates a verified lease PDF with a certificate page and stable hash", async () => {
    const contract = await PDFDocument.create();
    contract.addPage();
    const contractBytes = await contract.save();

    const input = {
      serialNumber: "ED-LSE-2026-ABCDEFGHJK",
      verificationUrl: "https://estatedesk.co.ke/verify-document/lease-code",
      issuedAt: new Date("2026-06-30T09:00:00.000Z"),
      organizationName: "EstateDesk Demo",
      organizationAddress: "Nairobi, Kenya",
      tenantName: "Test Tenant",
      tenantId: "tenant_123",
      tenantPhone: "+254700000000",
      tenantEmail: "tenant@example.com",
      tenantNationalIdMasked: "****1234",
      tenantStatus: "ACTIVE",
      tenantBelongsToOrg: true,
      propertyName: "Sunset Apartments",
      buildingName: "Block A",
      unitName: "A1",
      leaseId: "lease_123",
      leaseStatus: "ACTIVE",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: null,
      monthlyRent: 25_000,
      deposit: 50_000,
      dueDay: 5,
      currencyCode: "KES",
      sourceContractHash: "abc123",
      contractFileName: "lease-a1.pdf",
    };

    const first = await generateVerifiedLeasePdf(contractBytes, input);
    const second = await generateVerifiedLeasePdf(contractBytes, input);

    assert.equal(Buffer.from(first).subarray(0, 5).toString(), "%PDF-");
    assert.ok(first.byteLength > contractBytes.byteLength);
    assert.equal(hashDocumentContent(first), hashDocumentContent(second));
  });
});
