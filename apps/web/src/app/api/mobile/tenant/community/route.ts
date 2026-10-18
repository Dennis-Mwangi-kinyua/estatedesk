import { prisma } from "@/lib/prisma";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { mobileNoticeReadSchema } from "@estatedesk/contracts/mobile";
import { acknowledgeNotice } from "@/features/community/actions";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/community")) return mobileJson({ error: "Community access is unavailable." }, 403);
    const tenant = await prisma.tenant.findFirst({ where: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null }, select: { id: true } });
    if (!tenant) return mobileJson({ error: "Tenant profile not found." }, 404);
    const rows = await prisma.communityNoticeRecipient.findMany({
      where: { tenantId: tenant.id, notice: { orgId: session.activeOrgId! } },
      select: { id: true, readAt: true, notice: { select: { title: true, message: true, publishedAt: true, org: { select: { name: true } } } } },
      orderBy: { notice: { publishedAt: "desc" } }, take: 100,
    });
    return mobileJson(rows.map(row => ({ id: row.id, title: row.notice.title, message: row.notice.message, organizationName: row.notice.org.name, publishedAt: row.notice.publishedAt.toISOString(), readAt: row.readAt?.toISOString() ?? null })));
  }, { role: "TENANT" });
}
export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/community")) return mobileJson({ error: "Community access is unavailable." }, 403);
    const input = await nativeBody(request, mobileNoticeReadSchema);
    const form = new FormData(); form.set("id", input.id);
    const result = await acknowledgeNotice({}, form);
    return result.error ? mobileJson({ error: result.error }, 400) : mobileJson({ ok: true });
  }, { role: "TENANT" });
}
