import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { issueDocumentRecord } from "@/lib/documents/registry";
import { generateReceiptPdf } from "@/lib/documents/receipt-pdf";
import {
  documentVerificationPath,
  hashDocumentContent,
} from "@/lib/documents/identity";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function requestIp(headerStore: Headers) {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ receiptId: string }> },
) {
  const session = await requireUserSession();
  const { receiptId } = await params;
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      document: true,
      payment: {
        include: {
          org: { select: { id: true, name: true, address: true, currencyCode: true } },
          payerTenant: { select: { fullName: true, userId: true } },
          payerUser: { select: { fullName: true } },
        },
      },
    },
  });

  if (!receipt) notFound();

  const sameOrganization = session.activeOrgId === receipt.payment.orgId;
  const managementRole = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(
    session.activeOrgRole ?? "",
  );
  const ownsReceipt =
    receipt.payment.payerTenant?.userId === session.userId ||
    receipt.payment.payerUserId === session.userId;

  if (!sameOrganization || (!managementRole && !ownsReceipt)) notFound();
  if (!["VERIFIED", "NOT_REQUIRED"].includes(receipt.payment.verificationStatus)) {
    return new Response("Receipt is not available until the payment is verified.", {
      status: 409,
    });
  }

  let document = receipt.document;
  if (!document) {
    document = await prisma.$transaction(async (tx) => {
      const issued = await issueDocumentRecord({
        db: tx,
        orgId: receipt.payment.orgId,
        documentType: "RECEIPT",
        entityType: "Payment",
        entityId: receipt.payment.id,
        title: `Payment receipt ${receipt.receiptNo}`,
        issuedAt: receipt.issuedAt,
        preferredSerialNumber: receipt.receiptNo,
        metadata: { paymentId: receipt.payment.id, legacyReceipt: true },
      });

      await tx.receipt.update({
        where: { id: receipt.id },
        data: { documentId: issued.id },
      });
      return issued;
    });
  }

  const verificationUrl = absoluteUrl(
    documentVerificationPath(document.verificationCode),
  );
  const pdfBytes = await generateReceiptPdf({
    serialNumber: document.serialNumber,
    verificationUrl,
    status: document.status,
    issuedAt: document.issuedAt,
    organizationName: receipt.payment.org.name,
    organizationAddress: receipt.payment.org.address,
    payerName:
      receipt.payment.payerTenant?.fullName ??
      receipt.payment.payerUser?.fullName ??
      receipt.payment.payerName ??
      "Payer",
    amount: Number(receipt.payment.amount),
    currencyCode: receipt.payment.org.currencyCode,
    paymentMethod: receipt.payment.method,
    paymentFor: receipt.payment.targetType,
    paymentReference:
      receipt.payment.externalReference ??
      receipt.payment.reference ??
      receipt.payment.checkoutRequestId,
    paidAt: receipt.payment.paidAt ?? receipt.payment.createdAt,
  });
  const contentHash = hashDocumentContent(pdfBytes);

  if (document.contentHash && document.contentHash !== contentHash) {
    return new Response("The generated artifact does not match its registered hash.", {
      status: 409,
    });
  }

  const headerStore = await headers();
  await prisma.$transaction([
    prisma.documentRecord.updateMany({
      where: { id: document.id, contentHash: null },
      data: { contentHash },
    }),
    prisma.documentEvent.create({
      data: {
        orgId: document.orgId,
        documentId: document.id,
        eventType: "DOWNLOADED",
        actorUserId: session.userId,
        ip: requestIp(headerStore),
        userAgent: headerStore.get("user-agent"),
        metadata: { receiptId: receipt.id },
      },
    }),
  ]);

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.serialNumber}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Document-Serial": document.serialNumber,
      "X-Document-SHA256": contentHash,
    },
  });
}
