import { createProfessionalPdf } from "@/lib/documents/professional-pdf";
import { accessibleAgreement, hashAgreement } from "@/lib/service-agreements/service";
import { prisma } from "@/lib/prisma";
import { getRequestAuditMetadata } from "@/lib/audit/security";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const access = await accessibleAgreement((await params).id);
  if (!access) return new Response("Not found", {status: 404, headers: {"Cache-Control": "private, no-store"}});
  const {document, data, session} = access;
  if (hashAgreement(data.body) !== document.contentHash) return new Response("Document integrity check failed", { status: 409, headers: {"Cache-Control":"private, no-store"} });
  const pdf = await createProfessionalPdf({title: "Service agreement and DPA", documentTitle: document.title, serialNumber: document.serialNumber, organizationName: "Afrisilicon Technology Limited | EstateDesk", issuedAt: document.issuedAt, footerText: "EstateDesk | Authenticated electronic signatures recorded in the signature schedule."});
  if (document.status === "DRAFT") pdf.section("UNSIGNED DRAFT");
  for (const paragraph of data.body.split("\n\n")) {
    const [heading, ...lines] = paragraph.split("\n");
    if (lines.length && (/^\d+\./.test(heading) || heading === heading.toUpperCase())) {
      pdf.section(heading);
      pdf.paragraph(lines.join("\n"));
    } else pdf.paragraph(paragraph);
  }
  pdf.section("Signature record");
  pdf.paragraph(`Status: ${document.status}`);
  for (const [index, signature] of [data.platformSignature, data.organizationSignature].entries()) {
    pdf.section(index ? "Organization signature" : "EstateDesk signature");
    pdf.paragraph(signature ? `Name: ${signature.name}\nAuthenticated account: ${signature.userId}\nSigned at: ${signature.signedAt}\nAgreement text SHA-256: ${signature.contentHash}\nConsent and signing authority recorded.` : "Not signed");
  }
  pdf.section("Integrity reference");
  pdf.paragraph(`SHA-256 of the agreed text: ${document.contentHash}`, {size: 8});
  const request = await getRequestAuditMetadata();
  await prisma.documentEvent.create({ data: {documentId: document.id, orgId: document.orgId, actorUserId: session.userId, eventType:"DOWNLOADED",ip:request.ip,userAgent:request.userAgent,metadata:{contentHash:document.contentHash}} });
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${document.serialNumber}.pdf"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
