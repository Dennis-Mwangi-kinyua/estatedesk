import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const tenant = await prisma.tenant.findFirst({ where: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null }, select: { id: true } });
    if (!tenant) return mobileJson([]);
    const payments = await prisma.payment.findMany({
      where: { orgId: session.activeOrgId!, payerTenantId: tenant.id }, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, amount: true, gatewayStatus: true, verificationStatus: true, createdAt: true, externalReference: true },
    });
    return mobileJson(payments.map(item => ({ id: item.id, amount: Number(item.amount), gatewayStatus: item.gatewayStatus, verificationStatus: item.verificationStatus, createdAt: item.createdAt.toISOString(), reference: item.externalReference })));
  }, { role: "TENANT" });
}
