import { PDFDocument } from "pdf-lib";
import { createProfessionalPdf } from "./professional-pdf";

export type LeaseSigningCertificate = {
  envelopeId: string; leaseId: string; organizationName: string; premises: string;
  version: number; sourceDocumentHash: string; consentVersion: string; verificationUrl: string;
  signers: Array<{ role: string; name: string; signatureText: string | null; signatureMethod: string | null;
    signedAt: Date | null; ipAddress: string | null; signatureImageHash: string | null; image?: Uint8Array }>;
};

export async function appendLeaseSigningCertificate(source: Uint8Array, data: LeaseSigningCertificate) {
  const certificate = await createProfessionalPdf({ title: "Tenancy agreement signatures", serialNumber: data.envelopeId,
    organizationName: data.organizationName, issuedAt: new Date(), verificationUrl: data.verificationUrl,
    footerText: "EstateDesk | Electronic signing evidence" });
  certificate.paragraph(data.organizationName, { size: 18, strong: true });
  certificate.details([["Premises", data.premises], ["Lease reference", data.leaseId], ["Version", String(data.version)],
    ["Source SHA-256", data.sourceDocumentHash], ["Consent version", data.consentVersion]]);
  for (const signer of data.signers) {
    certificate.section(`${signer.role} signature`);
    certificate.details([["Name", signer.name], ["Electronic signature", signer.signatureText], ["Method", signer.signatureMethod ?? "TYPED"],
      ["Signed at (UTC)", signer.signedAt?.toISOString()], ["Signature SHA-256", signer.signatureImageHash]]);
    if (signer.image) await certificate.signatureImage(`data:image/png;base64,${Buffer.from(signer.image).toString("base64")}`);
  }
  await certificate.verification("Scan to verify completion, both parties’ signatures, and the registered final PDF fingerprint. Compare the downloaded file’s SHA-256 with the registry fingerprint.");
  const pdf = await PDFDocument.load(source);
  const appendix = await PDFDocument.load(await certificate.save());
  for (const page of await pdf.copyPages(appendix, appendix.getPageIndices())) pdf.addPage(page);
  return pdf.save({ useObjectStreams: false });
}
