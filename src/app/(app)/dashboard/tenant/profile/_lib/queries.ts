import { prisma } from "@/lib/prisma";
import { getTenantLedger } from "@/lib/ledger";

export async function getTenantProfileData(userId: string, activeOrgId: string | null) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      userId,
      deletedAt: null,
    },
    include: {
      nextOfKin: true,
    },
  });

  if (!tenant) {
    return { tenant: null, paymentHealth: null };
  }

  const paymentLedger = activeOrgId
    ? await getTenantLedger(userId, activeOrgId)
    : null;

  return {
    tenant,
    paymentHealth: paymentLedger?.row ?? null,
  };
}