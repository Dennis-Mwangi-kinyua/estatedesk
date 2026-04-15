import { prisma } from "@/lib/prisma";

export async function getTenantDashboardData(tenantId: string, unitId?: string) {
  const [recentPayments, waterBills, notifications] = await Promise.all([
    prisma.payment.findMany({
      where: {
        payerTenantId: tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        reference: true,
        method: true,
        gatewayStatus: true,
        verificationStatus: true,
        createdAt: true,
        paidAt: true,
      },
    }),

    prisma.waterBill.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        period: true,
        total: true,
        status: true,
        dueDate: true,
      },
    }),

    prisma.notification.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        readAt: true,
      },
    }),
  ]);

  const issues = unitId
    ? await prisma.issueTicket.findMany({
        where: {
          unitId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      })
    : [];

  return {
    recentPayments,
    waterBills,
    notifications,
    issues,
  };
}