import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { generateInvoicePdf } from "@/lib/documents/invoice-pdf";
import {
  isVerifiedDocumentAccessible,
  loadVerifiedPeriodInvoiceByCode,
} from "@/lib/documents/tenant-period-invoice";
import { hashDocumentContent, verifiedDocumentDownloadPath } from "@/lib/documents/identity";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function requestIp(headerStore: Headers) {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const viewInline = new URL(request.url).searchParams.get("view") === "1";

  const context = await loadVerifiedPeriodInvoiceByCode(code);
  if (!context || !context.documentValid) {
    notFound();
  }

  const { document, pdfData } = context;
  const pdfBytes = await generateInvoicePdf(pdfData);
  const contentHash = hashDocumentContent(pdfBytes);
  const hashChanged = Boolean(
    document.contentHash && document.contentHash !== contentHash,
  );

  if (hashChanged && ["REVOKED", "SUPERSEDED"].includes(document.status)) {
    return new Response("This invoice is no longer available for download.", {
      status: 409,
    });
  }

  const headerStore = await headers();
  await prisma.$transaction([
    prisma.documentRecord.update({
      where: { id: document.id },
      data: { contentHash },
    }),
    prisma.documentEvent.create({
      data: {
        orgId: document.orgId,
        documentId: document.id,
        eventType: viewInline ? "VIEWED" : "DOWNLOADED",
        ip: requestIp(headerStore),
        userAgent: headerStore.get("user-agent"),
        metadata: {
          period: pdfData.period,
          tenantId: context.tenant.id,
          publicVerification: true,
          viewInline,
          ...(hashChanged
            ? { hashUpdated: true, previousHash: document.contentHash }
            : {}),
        },
      },
    }),
  ]);

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${viewInline ? "inline" : "attachment"}; filename="${document.serialNumber}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Document-Serial": document.serialNumber,
      Link: `<${verifiedDocumentDownloadPath(code)}>; rel="alternate"; title="Download invoice PDF"`,
    },
  });
}