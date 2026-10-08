import assert from "node:assert/strict";
import { it } from "node:test";
import { PDFDocument } from "pdf-lib";
import { generateLeaseAgreementPdf, DEFAULT_LEASE_TERMS } from "../../apps/web/src/lib/documents/lease-agreement-pdf";
const data = { title: "Customized tenancy agreement", landlordName: "Example Owner", organizationName: "Example Management", tenantName: "Example Tenant", premises: "Example Property / Unit A1", leaseId: "lease-123", startDate: "08 Oct 2026", endDate: "08 Oct 2027", monthlyRent: "KES 20,000", deposit: "KES 20,000", dueDay: 5, terms: DEFAULT_LEASE_TERMS };
it("generates a readable PDF with the customized title and system author", async () => {
  const bytes = await generateLeaseAgreementPdf(data);
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getTitle(), data.title);
  assert.equal(pdf.getAuthor(), data.organizationName);
  assert.ok(pdf.getPageCount() >= 1);
});
it("paginates lengthy clauses and handles unsupported characters and long tokens", async () => {
  const bytes = await generateLeaseAgreementPdf({ ...data, tenantName: "Tenant 😀", terms: ("Custom clause with agreed conditions.\n".repeat(300)) + "x".repeat(2000) });
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 5);
});
