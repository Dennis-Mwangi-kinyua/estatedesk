import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { buildOrganizationCsvZip } from "@/lib/data-export/org-export";
import { writeAuditLog } from "@/lib/audit/security";

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

  const { fileName, zip } = await buildOrganizationCsvZip(exportRequest.orgId);

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

  return new NextResponse(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
