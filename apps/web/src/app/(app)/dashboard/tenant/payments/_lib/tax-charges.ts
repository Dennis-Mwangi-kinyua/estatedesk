import { prisma } from "@/lib/prisma";

export async function getTenantTaxCharges(tenantId: string, orgId: string) {
  return prisma.taxCharge.findMany({
    where: {
      tenantId,
      orgId,
    },
    orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
    take: 24,
    select: {
      id: true,
      period: true,
      taxType: true,
      taxAuthority: true,
      amountDue: true,
      amountPaid: true,
      balance: true,
      dueDate: true,
      status: true,
      assessmentRef: true,
    },
  });
}