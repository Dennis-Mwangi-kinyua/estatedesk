import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  documentVerificationPath,
  hashDocumentContent,
} from "@/lib/documents/identity";
import { createLeaseSnapshot, readLeaseSnapshot } from "@/lib/documents/lease-snapshot";
import { generateVerifiedLeasePdf } from "@/lib/documents/lease-verification-pdf";
import { issueDocumentRecord } from "@/lib/documents/registry";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { readAssetBytes } from "@/lib/storage/read-asset-bytes";
import {
  ensurePdfFilename,
  isPdfBytes,
  isPdfLeaseAsset,
  tenantLeaseDownloadPath,
} from "../../_lib/download";

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
  { params }: { params: Promise<{ leaseId: string }> },
) {
  const session = await requireTenantAccess();
  const { leaseId } = await params;

  if (!session.userId || !session.activeOrgId) {
    notFound();
  }

  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      deletedAt: null,
      tenant: {
        userId: session.userId,
        orgId: session.activeOrgId,
        deletedAt: null,
      },
    },
    include: {
      contractDocument: true,
      unit: {
        include: {
          property: {
            select: {
              name: true,
            },
          },
          building: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!lease?.contractDocument?.key) {
    notFound();
  }

  const asset = lease.contractDocument;

  if (!isPdfLeaseAsset(asset)) {
    return new Response("Only PDF lease contracts can be downloaded.", {
      status: 415,
    });
  }

  const contractBytes = await readAssetBytes(asset.key);

  if (!isPdfBytes(contractBytes)) {
    return new Response("The stored lease file is not a valid PDF.", {
      status: 415,
    });
  }

  const sourceContractHash = hashDocumentContent(contractBytes);
  const fallbackName = `lease-${lease.unit.property.name}-${lease.unit.houseNo}.pdf`;
  const fileName = ensurePdfFilename(asset.fileName || fallbackName);

  let document = await prisma.documentRecord.findUnique({
    where: {
      orgId_documentType_entityType_entityId_version: {
        orgId: lease.orgId,
        documentType: "LEASE",
        entityType: "Lease",
        entityId: lease.id,
        version: 1,
      },
    },
  });

  if (!document) {
    document = await prisma.$transaction(async (tx) =>
      issueDocumentRecord({
        db: tx,
        orgId: lease.orgId,
        documentType: "LEASE",
        entityType: "Lease",
        entityId: lease.id,
        title: `Lease ${lease.unit.property.name} / Unit ${lease.unit.houseNo}`,
        issuedByUserId: session.userId,
        issuedAt: new Date(),
        mimeType: "application/pdf",
        metadata: {
          leaseId: lease.id,
          tenantId: lease.tenantId,
        },
      }),
    );
  }

  const existingSnapshot = readLeaseSnapshot(document.metadata);
  const snapshot =
    existingSnapshot?.sourceContractHash === sourceContractHash
      ? existingSnapshot
      : await createLeaseSnapshot(
          prisma,
          lease.id,
          sourceContractHash,
          asset.fileName,
        );

  const verificationUrl = absoluteUrl(
    documentVerificationPath(document.verificationCode),
  );

  const pdfBytes = await generateVerifiedLeasePdf(contractBytes, {
    serialNumber: document.serialNumber,
    verificationUrl,
    issuedAt: document.issuedAt,
    organizationName: snapshot.organizationName,
    organizationAddress: snapshot.organizationAddress,
    tenantName: snapshot.tenantName,
    tenantId: snapshot.tenantId,
    tenantPhone: snapshot.tenantPhone,
    tenantEmail: snapshot.tenantEmail,
    tenantNationalIdMasked: snapshot.tenantNationalIdMasked,
    tenantStatus: snapshot.tenantStatus,
    tenantBelongsToOrg: snapshot.tenantBelongsToOrg,
    propertyName: snapshot.propertyName,
    buildingName: snapshot.buildingName,
    unitName: snapshot.unitName,
    leaseId: snapshot.leaseId,
    leaseStatus: snapshot.leaseStatus,
    startDate: new Date(snapshot.startDate),
    endDate: snapshot.endDate ? new Date(snapshot.endDate) : null,
    monthlyRent: snapshot.monthlyRent,
    deposit: snapshot.deposit,
    dueDay: snapshot.dueDay,
    currencyCode: snapshot.currencyCode,
    sourceContractHash: snapshot.sourceContractHash,
    contractFileName: snapshot.contractFileName,
  });

  const contentHash = hashDocumentContent(pdfBytes);
  const viewInline = new URL(request.url).searchParams.get("view") === "1";
  const headerStore = await headers();

  await prisma.$transaction([
    prisma.documentRecord.update({
      where: { id: document.id },
      data: {
        contentHash,
        metadata: {
          leaseId: lease.id,
          tenantId: lease.tenantId,
          leaseSnapshot: snapshot,
        },
      },
    }),
    prisma.documentEvent.create({
      data: {
        orgId: document.orgId,
        documentId: document.id,
        eventType: "DOWNLOADED",
        actorUserId: session.userId,
        ip: requestIp(headerStore),
        userAgent: headerStore.get("user-agent"),
        metadata: {
          leaseId: lease.id,
          viewInline,
        },
      },
    }),
  ]);

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${viewInline ? "inline" : "attachment"}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Document-Serial": document.serialNumber,
      "X-Document-SHA256": contentHash,
      Link: `<${tenantLeaseDownloadPath(lease.id)}>; rel="alternate"; title="Download lease PDF"`,
    },
  });
}