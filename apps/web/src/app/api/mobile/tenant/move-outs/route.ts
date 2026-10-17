import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const notices = await prisma.moveOutNotice.findMany({
      where: { tenant: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null }, lease: { orgId: session.activeOrgId! } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100,
      select: { id: true, status: true, noticeDate: true, moveOutDate: true,
        inspection: { select: { scheduledAt: true, status: true } },
        lease: { select: { unit: { select: { houseNo: true, property: { select: { name: true } } } } } } },
    });
    return mobileJson(notices.map(notice => ({
      id: notice.id, status: notice.status, noticeDate: notice.noticeDate.toISOString(), moveOutDate: notice.moveOutDate.toISOString(),
      inspectionAt: notice.inspection?.scheduledAt.toISOString() ?? null, inspectionStatus: notice.inspection?.status ?? null,
      propertyName: notice.lease.unit.property.name, unitLabel: notice.lease.unit.houseNo,
    })));
  }, { role: "TENANT" });
}
