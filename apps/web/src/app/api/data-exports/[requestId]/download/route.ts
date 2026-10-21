import { NextResponse } from "next/server";
import { safeApiErrorResponse } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { buildOrganizationCsvZip } from "@/lib/data-export/org-export";
import { DataExportTooLargeError } from "@/lib/data-export/limits";
import { writeAuditLog } from "@/lib/audit/security";
import { sendSecurityAlert } from "@/lib/security/alerts";
import { decodePublicId } from "@/lib/public-id";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

function isOrgExportRole(role: string | null) {
  return ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(role ?? "");
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireUserSession();
  const { requestId: publicRequestId } = await context.params;
  const requestId = decodePublicId(publicRequestId, "data-export");

  const exportRequest = await prisma.dataExportRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      orgId: true,
      requestedByUserId: true,
      status: true,
      expiresAt: true,
      downloadedAt: true,
    },
  });

  if (!exportRequest) {
    return NextResponse.json({ error: "Export request not found." }, { status: 404 });
  }

  const canAccess =
    session.activeOrgId === exportRequest.orgId &&
    (exportRequest.requestedByUserId === session.userId ||
      isOrgExportRole(session.activeOrgRole));

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (exportRequest.status !== "APPROVED") {
    return NextResponse.json({ error: "Export request is not approved." }, { status: 409 });
  }

  if (exportRequest.expiresAt && exportRequest.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Export approval has expired." }, { status: 410 });
  }
  if (exportRequest.downloadedAt) {
    return NextResponse.json({ error: "This approved export has already been downloaded." }, { status: 410 });
  }

  let exportZip: Awaited<ReturnType<typeof buildOrganizationCsvZip>>;

  try {
    exportZip = await buildOrganizationCsvZip(exportRequest.orgId);
  } catch (error) {
    if (error instanceof DataExportTooLargeError) {
      return NextResponse.json(
        {
          error:
            "This export is too large for immediate download. Use a smaller period or run it as an offline export.",
          dataset: error.dataset,
          rowLimit: error.rowLimit,
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      safeApiErrorResponse(
        "dataExports.download",
        error,
        "Could not prepare the data export.",
      ),
      { status: 500 },
    );
  }

  // Claim the single download after the archive is ready so a failed export build
  // does not consume the organization's one-time download.
  const downloadedAt = new Date();
  const claim = await prisma.dataExportRequest.updateMany({
    where: {
      id: exportRequest.id,
      status: "APPROVED",
      downloadedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: downloadedAt } }],
    },
    data: { downloadedAt },
  });
  if (claim.count !== 1) {
    const latest = await prisma.dataExportRequest.findUnique({
      where: { id: exportRequest.id },
      select: { status: true, expiresAt: true, downloadedAt: true },
    });
    if (!latest || latest.status !== "APPROVED") {
      return NextResponse.json({ error: "Export request is no longer approved." }, { status: 409 });
    }
    if (latest.expiresAt && latest.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Export approval has expired." }, { status: 410 });
    }
    return NextResponse.json({ error: "This approved export has already been downloaded." }, { status: 410 });
  }

  await writeAuditLog({
    orgId: exportRequest.orgId,
    actorUserId: session.userId,
    action: "DATA_EXPORT_DOWNLOADED",
    entityType: "DataExportRequest",
    entityId: exportRequest.id,
    metadata: {
      platformRole: session.platformRole,
      activeOrgRole: session.activeOrgRole,
      requestedByUserId: exportRequest.requestedByUserId,
      downloadedAt: downloadedAt.toISOString(),
    },
  });

  await sendSecurityAlert({
    event: "DATA_EXPORT_DOWNLOADED",
    severity: "critical",
    actorUserId: session.userId,
    orgId: exportRequest.orgId,
    entityType: "DataExportRequest",
    entityId: exportRequest.id,
    summary: "An organization data export was downloaded.",
    metadata: {
      platformRole: session.platformRole,
      activeOrgRole: session.activeOrgRole,
      requestedByUserId: exportRequest.requestedByUserId,
    },
  });

  return new NextResponse(exportZip.zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${exportZip.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
