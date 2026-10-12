import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { PDFDocument, PDFArray, PDFName, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { generateReceiptPdf } from "../../apps/web/src/lib/documents/receipt-pdf";
import { generateInvoicePdf } from "../../apps/web/src/lib/documents/invoice-pdf";
import { generateLeaseAgreementPdf } from "../../apps/web/src/lib/documents/lease-agreement-pdf";
import { generateVerifiedLeasePdf } from "../../apps/web/src/lib/documents/lease-verification-pdf";
import { generateTribunalPackPdf } from "../../apps/web/src/lib/documents/tribunal-pack-pdf";

const issuedAt = new Date("2026-10-12T09:00:00Z");
async function inspect(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes);
  const streams: string[] = [];
  for (const page of pdf.getPages()) {
    const contents = page.node.lookup(PDFName.of("Contents"));
    const entries = contents instanceof PDFArray ? contents.asArray() : [contents];
    for (const entry of entries) {
      const stream = pdf.context.lookup(entry!);
      if (stream instanceof PDFRawStream) streams.push(Buffer.from(decodePDFRawStream(stream).decode()).toString());
    }
  }
  const content = streams.join("\n");
  for (const match of content.matchAll(/1 0 0 1 ([\d.-]+) ([\d.-]+) Tm/g)) {
    assert.ok(Number(match[1]) >= 39 && Number(match[1]) <= 555.28, `text x outside paper: ${match[1]}`);
    assert.ok(Number(match[2]) >= 32 && Number(match[2]) <= 810, `text y outside paper: ${match[2]}`);
  }
  return { pdf, content, contains: (text: string) => content.includes(Buffer.from(text).toString("hex").toUpperCase()) };
}

describe("professional financial exports", () => {
  it("preserves the registered bytes of existing version-one receipts", async () => {
    const bytes = await generateReceiptPdf({ pdfTemplateVersion: 1, serialNumber: "RECEIPT-2026-FROZEN", verificationUrl: "https://example.test/verify/receipt", status: "ISSUED", issuedAt, organizationName: "Greenview Organisation", payerName: "Demo Tenant", amount: 25000, currencyCode: "KES", paymentMethod: "MPESA", paymentFor: "RENT", paidAt: issuedAt, periods: ["2026-10"] });
    assert.equal(createHash("sha256").update(bytes).digest("hex"), "622bc7936aa914c15b7e9dd3f101a05c686f8ced16af28167a1180e36424dc21");
  });
  it("keeps custom lease clauses and signature fields on paginated agreement pages", async () => {
    const result = await inspect(await generateLeaseAgreementPdf({ title: "Residential tenancy agreement", landlordName: "Demo Landlord", organizationName: "Demo Organisation", tenantName: "Demo Tenant", premises: "Greenview Gardens A12", leaseId: "lease-reference", startDate: "01 October 2026", endDate: "30 September 2027", monthlyRent: "KES 25,000.00", deposit: "KES 25,000.00", dueDay: 5, terms: Array.from({ length: 80 }, (_, i) => `Clause-${i + 1}: Agreed condition for this tenancy.`).join("\n") }));
    assert.ok(result.pdf.getPageCount() > 1);
    assert.ok(result.contains("Clause-80:"));
    assert.ok(result.contains("Witness (if applicable)"));
  });
  it("appends a readable certificate without changing source contract pages", async () => {
    const source = await PDFDocument.create();
    const sourcePage = source.addPage([500, 700]);
    sourcePage.drawText("ORIGINAL-SIGNED-CONTRACT", { x: 40, y: 600 });
    const result = await inspect(await generateVerifiedLeasePdf(await source.save(), { serialNumber: "LEASE-2026-TEST", verificationUrl: "https://example.test/verify/lease", issuedAt, organizationName: "Demo Organisation", tenantName: "Tenant Full Name ".repeat(10), tenantId: "tenant-reference", tenantPhone: "+254700000000", tenantStatus: "ACTIVE", tenantBelongsToOrg: true, propertyName: "Greenview Gardens", unitName: "A12", leaseId: "lease-reference", leaseStatus: "ACTIVE", startDate: issuedAt, monthlyRent: 25000.75, deposit: 25000.75, dueDay: 5, currencyCode: "KES", sourceContractHash: "a".repeat(64), contractFileName: "long-contract-filename-".repeat(8) + ".pdf" }));
    assert.equal(result.pdf.getPage(0).getWidth(), 500);
    assert.equal(result.pdf.getPage(0).getHeight(), 700);
    assert.ok(result.contains("ORIGINAL-SIGNED-CONTRACT"));
    assert.ok(result.contains("Contract SHA-256"));
    assert.ok(result.pdf.getPageCount() > 1);
  });
  it("keeps a typical single-payment receipt and its verification block on one A4 page", async () => {
    const result = await inspect(await generateReceiptPdf({ serialNumber: "RECEIPT-2026-TEST", verificationUrl: "https://example.test/verify/receipt", status: "ISSUED", issuedAt, organizationName: "Greenview Property Management", organizationAddress: "Nairobi, Kenya", payerName: "Demo Tenant", amount: 25000, currencyCode: "KES", paymentMethod: "MPESA", paymentFor: "RENT", paymentReference: "UJ12ABCDEF", paidAt: issuedAt, periods: ["2026-10"], allocations: [{ period: "2026-10", description: "Monthly rent", amount: 25000 }], previousBalance: 25000, remainingBalance: 0 }));
    assert.equal(result.pdf.getPageCount(), 1);
    assert.ok(result.contains("DOCUMENT VERIFICATION"));
  });
  it("retains every receipt allocation and paginates long payer and reference details", async () => {
    const result = await inspect(await generateReceiptPdf({ serialNumber: "RECEIPT-2026-TEST", verificationUrl: "https://example.test/verify/receipt", status: "ISSUED", issuedAt, organizationName: "Greenview International Property Management Organisation ".repeat(3), payerName: "Tenant Full Name ".repeat(8), amount: 40000, currencyCode: "KES", paymentMethod: "MPESA", paymentFor: "RENT", paymentReference: "LONGREFERENCE".repeat(20), paidAt: issuedAt, periods: ["2026-10"], allocations: Array.from({ length: 40 }, (_, index) => ({ period: "2026-10", description: `Allocation-${index + 1}`, amount: 1000 })) }));
    assert.ok(result.pdf.getPageCount() > 1);
    for (let index = 1; index <= 40; index++) assert.ok(result.contains(`Allocation-${index}`), `missing allocation ${index}`);
    assert.ok(result.contains("Remaining balance"));
  });
  it("retains the final invoice charge and water details across continuation pages", async () => {
    const result = await inspect(await generateInvoicePdf({ serialNumber: "INVOICE-2026-TEST", verificationCode: "verify-code", verificationUrl: "https://example.test/verify/invoice", status: "UNPAID", issuedAt, dueDate: issuedAt, period: "2026-10", organizationName: "Greenview Organisation", tenantName: "Test Tenant", propertyName: "Property Name ".repeat(10), unitName: "A1", currencyCode: "KES", amountDue: 50000, amountPaid: 0, balance: 50000, lines: Array.from({ length: 50 }, (_, index) => ({ label: `Charge-${index + 1}`, amountDue: 1000, amountPaid: 0, balance: 1000, ...(index === 49 ? { waterReading: { prevReading: 10, currentReading: 20, unitsUsed: 10, ratePerUnit: 100, fixedCharge: 0, billStatus: "UNPAID", readingStatus: "APPROVED" } } : {}) })) }));
    assert.ok(result.pdf.getPageCount() > 1);
    for (let index = 1; index <= 50; index++) assert.ok(result.contains(`Charge-${index}`));
    assert.ok(result.contains("Current reading"));
    assert.ok(result.contains("Balance due"));
  });
  it("downloads tribunal evidence with arrows, emoji and long unbroken message text", async () => {
    const result = await inspect(await generateTribunalPackPdf({ generatedAt: issuedAt, organizationName: "Test Organisation", tenantName: "Demo Tenant", propertyName: "Property", unitLabel: "A1", leaseStart: issuedAt, leaseEnd: null, charges: [], payments: [], communications: [{ at: issuedAt, channel: "IN_APP", subject: "Notice → review 🔔", summary: "MessageReference".repeat(300) + " FINAL-EVIDENCE" }], notes: ["Unicode evidence محفوظ"] }));
    assert.ok(result.pdf.getPageCount() > 1);
    assert.ok(result.contains("[U+2192]"));
    assert.ok(result.contains("[U+1F514]"));
    assert.ok(result.contains("FINAL-EVIDENCE"));
  });
});
