import { prisma } from "@/lib/prisma";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { computeRentRewards } from "@/lib/rewards/rent-rewards";
import { REWARD_CATALOG } from "@/lib/rewards/redeem";
import { mobileRewardInputSchema } from "@estatedesk/contracts/mobile";
import { requestTenantRewardAction } from "@/app/(app)/dashboard/tenant/rewards/actions";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/rewards")) return mobileJson({ error: "Rewards access is unavailable." }, 403);
    const tenant = await prisma.tenant.findFirst({
      where: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null },
      select: { id: true, payments: { where: { OR: [{ verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] } }, { gatewayStatus: "SUCCESS" }] }, select: { amount: true, paidAt: true, createdAt: true, verificationStatus: true, gatewayStatus: true }, orderBy: { createdAt: "desc" }, take: 120 } },
    });
    if (!tenant) return mobileJson({ error: "Tenant profile not found." }, 404);
    const [redemptions, total] = await Promise.all([
      prisma.rentRewardRedemption.findMany({ where: { orgId: session.activeOrgId!, tenantId: tenant.id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, label: true, pointsCost: true, status: true, createdAt: true, fulfilledAt: true } }),
      prisma.rentRewardRedemption.aggregate({ where: { orgId: session.activeOrgId!, tenantId: tenant.id, status: { in: ["PENDING", "FULFILLED"] } }, _sum: { pointsCost: true } }),
    ]);
    const snapshot = computeRentRewards(tenant.payments.map(p => ({ ...p, amount: Number(p.amount), paidAt: p.paidAt ?? p.createdAt })));
    const redeemedPoints = total._sum.pointsCost ?? 0;
    return mobileJson({ ...snapshot, availablePoints: Math.max(0, snapshot.points - redeemedPoints), redeemedPoints, catalog: REWARD_CATALOG, redemptions });
  }, { role: "TENANT" });
}
export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/rewards")) return mobileJson({ error: "Rewards access is unavailable." }, 403);
    const input = await nativeBody(request, mobileRewardInputSchema);
    const form = new FormData(); form.set("rewardId", input.rewardId);
    const result = await requestTenantRewardAction(form);
    return result.ok ? mobileJson(result) : mobileJson({ error: result.message }, 400);
  }, { role: "TENANT" });
}
