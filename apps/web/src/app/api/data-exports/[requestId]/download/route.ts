import { NextResponse } from "next/server";
import { safeApiErrorResponse } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { buildOrganizationCsvZip } from "@/lib/data-export/org-export";
import { DataExportTooLargeError } from "@/lib/data-export/limits";
import { writeAuditLog } from "@/lib/audit/security";
import { sendSecurityAlert } from "@/lib/security/alerts";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

function isPlatformAdmin(platformRole: string) {
  return platformRole === "SUPER_ADMIN" || platformRole === "PLATFORM_ADMIN";
}

function isOrgExportRole(role: string | null) {
  return ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(role ?? "");
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireUserSession();
  const { requestId } = await context.params;

  const exportRequest = await prisma.dataExportRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      orgId: true,
      requestedByUserId: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!exportRequest) {
    return NextResponse.json({ error: "Export request not found." }, { status: 404 });
  }

  const canAccess =
    isPlatformAdmin(session.platformRole) ||
    (session.activeOrgId === exportRequest.orgId &&
      (exportRequest.requestedByUserId === session.userId ||
        isOrgExportRole(session.activeOrgRole)));

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (exportRequest.status !== "APPROVED") {
    return NextResponse.json({ error: "Export request is not approved." }, { status: 409 });
  }

  if (exportRequest.expiresAt && exportRequest.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Export approval has expired." }, { status: 410 });
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
