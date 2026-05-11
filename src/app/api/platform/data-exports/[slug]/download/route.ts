import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrganizationCsvZip } from "@/lib/data-export/org-export";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { writeAuditLog } from "@/lib/audit/security";

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

  const { fileName, zip } = await buildOrganizationCsvZip(org.id);

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

  return new NextResponse(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
