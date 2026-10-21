import assert from "node:assert/strict";
import { it } from "node:test";
import { PDFDocument, PDFName, PDFDict, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { appendLeaseSigningCertificate } from "../../apps/web/src/lib/documents/signed-lease-pdf";

it("preserves the agreement and appends paginated signatures and QR verification", async () => {
  const original = await PDFDocument.create();
  original.addPage();
  original.setTitle("Agreed tenancy terms");
  const bytes = await appendLeaseSigningCertificate(await original.save(), {
    envelopeId: "envelope-123", leaseId: "lease-123", organizationName: "Example Organization",
    premises: "Property A / Unit 1", version: 1, sourceDocumentHash: "a".repeat(64), consentVersion: "2026-07-02",
    verificationUrl: "https://example.com/verify-lease/envelope/envelope-123",
    signers: Array.from({ length: 8 }, (_, index) => ({ role: index === 0 ? "ORGANIZATION" : "TENANT", name: "Signer 😀 " + index,
      signatureText: "Agreed Signer", signatureMethod: "TYPED", signedAt: new Date("2026-10-21T09:00:00Z"), ipAddress: "127.0.0.1", signatureImageHash: null })),
  });
  const final = await PDFDocument.load(bytes);
  const streams = final.context.enumerateIndirectObjects().flatMap(([, object]) => object instanceof PDFRawStream ? [Buffer.from(decodePDFRawStream(object).decode()).toString("latin1")] : []).join("\n");
  assert.equal(streams.includes(Buffer.from("127.0.0.1").toString("hex").toUpperCase()), false, "shared PDF must not contain signer IP addresses");
  assert.equal(final.getTitle(), "Agreed tenancy terms");
  assert.ok(final.getPageCount() > 2);
  assert.ok(final.getPages().slice(1).some(page => {
    const objects = page.node.Resources()?.lookupMaybe(PDFName.of("XObject"), PDFDict);
    return objects?.entries().length;
  }), "certificate contains the embedded QR image");
});
