import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { generateInvoicePdf } from "@/lib/documents/invoice-pdf";
import { loadTenantPeriodInvoice } from "@/lib/documents/tenant-period-invoice";
import { hashDocumentContent } from "@/lib/documents/identity";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { tenantInvoiceDownloadPath } from "../../_lib/paths";

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
  { params }: { params: Promise<{ period: string }> },
) {
  const { period } = await params;
  const viewInline = new URL(request.url).searchParams.get("view") === "1";

  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    notFound();
  }

  const context = await loadTenantPeriodInvoice(
    session.userId,
    session.activeOrgId,
    period,
  );

  if (!context) {
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
        actorUserId: session.userId,
        ip: requestIp(headerStore),
        userAgent: headerStore.get("user-agent"),
        metadata: {
          period,
          tenantId: context.tenant.id,
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
      "X-Document-SHA256": contentHash,
      Link: `<${tenantInvoiceDownloadPath(period)}>; rel="alternate"; title="Download invoice PDF"`,
    },
  });
}