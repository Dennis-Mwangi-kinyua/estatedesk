import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrganizationCsvZip } from "@/lib/data-export/org-export";
import { DataExportTooLargeError } from "@/lib/data-export/limits";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { writeAuditLog } from "@/lib/audit/security";
import { sendSecurityAlert } from "@/lib/security/alerts";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const { slug } = await context.params;

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  let exportZip: Awaited<ReturnType<typeof buildOrganizationCsvZip>>;

  try {
    exportZip = await buildOrganizationCsvZip(org.id);
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

    throw error;
  }

  await writeAuditLog({
    orgId: org.id,
    actorUserId: session.userId,
    action: "PLATFORM_DATA_EXPORT_DOWNLOADED",
    entityType: "Organization",
    entityId: org.id,
    metadata: {
      slug,
      platformRole: session.platformRole,
    },
  });

  await sendSecurityAlert({
    event: "PLATFORM_DATA_EXPORT_DOWNLOADED",
    severity: "critical",
    actorUserId: session.userId,
    orgId: org.id,
    entityType: "Organization",
    entityId: org.id,
    summary: `A platform administrator downloaded an organization export for ${slug}.`,
    metadata: {
      slug,
      platformRole: session.platformRole,
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
