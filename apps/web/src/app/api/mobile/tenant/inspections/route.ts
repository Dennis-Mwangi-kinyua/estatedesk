import { prisma } from "@/lib/prisma";
import { nativeRoute } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { encodePublicId } from "@/lib/public-id";
import { inspectionPhotos } from "@/lib/mobile/inspection-photos";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/inspections")) return mobileJson({ error: "Inspection access is unavailable." }, 403);
    const raw = Number(new URL(request.url).searchParams.get("page") ?? 1);
    const page = Number.isSafeInteger(raw) && raw > 0 ? Math.min(raw, 10000) : 1;
    const rows = await prisma.inspection.findMany({
      where: { notice: { tenant: { userId: session.userId, orgId: session.activeOrgId!, deletedAt: null }, lease: { orgId: session.activeOrgId! } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 26,
      select: { id: true, status: true, scheduledAt: true, completedAt: true, notes: true, checklist: true, inspector: { select: { fullName: true } }, notice: { select: { lease: { select: { unit: { select: { houseNo: true, property: { select: { name: true } } } } } } } } },
    });
    return mobileJson({ page, hasMore: rows.length > 25, items: rows.slice(0, 25).map(row => ({
      id: row.id, status: row.status, scheduledAt: row.scheduledAt, completedAt: row.completedAt, inspectorName: row.inspector.fullName,
      notes: row.notes, checklist: row.checklist, photos: inspectionPhotos(row.checklist), unitLabel: `${row.notice.lease.unit.property.name} · Unit ${row.notice.lease.unit.houseNo}`,
      reportPath: `/dashboard/tenant/inspections/${encodePublicId(row.id, "inspection")}/download`,
    })) });
  }, { role: "TENANT" });
}
