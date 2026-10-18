import { prisma } from "@/lib/prisma";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { mobileProfileInputSchema } from "@estatedesk/contracts/mobile";
import { updateTenantProfileAction } from "@/app/(app)/dashboard/tenant/profile/actions";
export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/profile")) return mobileJson({ error: "Profile access is unavailable." }, 403);
    const tenant = await prisma.tenant.findFirst({ where: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null }, select: { fullName: true, phone: true, email: true, nextOfKin: { select: { name: true, relationship: true, phone: true, email: true } } } });
    if (!tenant) return mobileJson({ error: "Tenant profile not found." }, 404);
    return mobileJson({ fullName: tenant.fullName, phone: tenant.phone, email: tenant.email ?? "", nextOfKinName: tenant.nextOfKin?.name ?? "", nextOfKinRelationship: tenant.nextOfKin?.relationship ?? "", nextOfKinPhone: tenant.nextOfKin?.phone ?? "", nextOfKinEmail: tenant.nextOfKin?.email ?? "" });
  }, { role: "TENANT" });
}
export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/profile/edit")) return mobileJson({ error: "An active tenancy and profile access are required to edit your profile." }, 403);
    const input = await nativeBody(request, mobileProfileInputSchema);
    const form = new FormData(); for (const [key, value] of Object.entries(input)) form.set(key, value);
    const result = await updateTenantProfileAction({ ok: false }, form);
    return result.ok ? mobileJson({ ok: true }) : mobileJson({ error: result.error ?? "Unable to update profile." }, 400);
  }, { role: "TENANT" });
}
