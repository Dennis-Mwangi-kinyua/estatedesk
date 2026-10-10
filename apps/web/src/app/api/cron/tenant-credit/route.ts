import { prisma } from "@/lib/prisma";
import { applyTenantCreditWithRetry } from "@/lib/payments/tenant-credit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  const tenants = await prisma.payment.findMany({ where: { verificationStatus: "VERIFIED", gatewayStatus: "SUCCESS", reversedAt: null, unappliedAmount: { gt: 0 }, payerTenantId: { not: null } }, distinct: ["orgId", "payerTenantId"], select: { orgId: true, payerTenantId: true } });
  let updated = 0;
  for (const tenant of tenants) {
    const applied = await applyTenantCreditWithRetry(prisma, tenant.orgId, tenant.payerTenantId!);
    if (applied.gt(0)) updated++;
  }
  return Response.json({ tenantsChecked: tenants.length, tenantsUpdated: updated });
}
