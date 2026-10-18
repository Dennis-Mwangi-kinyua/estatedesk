import { prisma } from "@/lib/prisma";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { mobileExpenditureInputSchema } from "@estatedesk/contracts/mobile";
import { createTenantExpenditureAction } from "@/app/(app)/dashboard/tenant/expenditures/actions";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/expenditures")) return mobileJson({ error: "Expenditure access is unavailable." }, 403);
    const tenant = await prisma.tenant.findFirst({ where: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null }, select: { id: true, org: { select: { currencyCode: true } } } });
    if (!tenant) return mobileJson({ error: "Tenant profile not found." }, 404);
    const raw = Number(new URL(request.url).searchParams.get("page") ?? "1");
    const page = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 10000) : 1;
    const rows = await prisma.expenditure.findMany({ where: { orgId: session.activeOrgId!, tenantId: tenant.id }, select: { id: true, description: true, amount: true, currencyCode: true, category: true, incurredAt: true, status: true }, orderBy: [{ incurredAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 26 });
    return mobileJson({ page, hasMore: rows.length > 25, currencyCode: tenant.org.currencyCode, items: rows.slice(0, 25).map(item => ({ ...item, amount: Number(item.amount), incurredAt: item.incurredAt.toISOString() })) });
  }, { role: "TENANT" });
}
export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/expenditures")) return mobileJson({ error: "Expenditure access is unavailable." }, 403);
    const input = await nativeBody(request, mobileExpenditureInputSchema);
    const form = new FormData(); for (const [key, value] of Object.entries(input)) form.set(key, String(value));
    await createTenantExpenditureAction(form);
    return mobileJson({ ok: true });
  }, { role: "TENANT" });
}
