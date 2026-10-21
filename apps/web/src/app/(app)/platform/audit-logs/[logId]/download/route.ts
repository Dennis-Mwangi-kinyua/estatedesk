import { notFound } from "next/navigation";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { auditExport } from "@/lib/audit/log-detail";
import { writePlatformAuditLog } from "@/lib/audit/security";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ logId: string }> }) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const { logId } = await params;
  const log = await prisma.auditLog.findUnique({ where: { id: logId }, include: { actor: { select: { id: true, fullName: true, email: true, platformRole: true } }, org: { select: { id: true, name: true, slug: true, status: true } } } });
  if (!log) notFound();
  const body = JSON.stringify(auditExport(log), null, 2);
  await writePlatformAuditLog({ actorUserId: session.userId, action: "AUDIT_LOG_DOWNLOADED", entityType: "AuditLog", entityId: log.id, metadata: { orgId: log.orgId, originalAction: log.action } });
  return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="audit-log-${log.id.replace(/[^a-z0-9_-]/gi, "_")}.json"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow" } });
}
