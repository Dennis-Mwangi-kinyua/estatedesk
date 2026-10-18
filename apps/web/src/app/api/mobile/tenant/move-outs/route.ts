import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody, actionResult } from "@/lib/mobile/route";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { mobileMoveOutInputSchema } from "@estatedesk/contracts/mobile";
import { submitMoveOutNotice, withdrawMoveOutNotice } from "@/app/(app)/dashboard/tenant/notices/actions";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/notices")) return mobileJson({ error: "Move-out access is unavailable." }, 403);
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

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/move-out")) return mobileJson({ error: "An active tenancy and move-out access are required." }, 403);
    const input = await nativeBody(request, mobileMoveOutInputSchema);
    const form = new FormData();
    if (input.action === "submit") {
      form.set("moveOutDate", input.moveOutDate); form.set("notes", input.notes);
      return actionResult(() => submitMoveOutNotice(form), "/dashboard/tenant/move-out");
    }
    form.set("noticeId", input.noticeId);
    return actionResult(() => withdrawMoveOutNotice(form), "/dashboard/tenant/notices");
  }, { role: "TENANT" });
}
