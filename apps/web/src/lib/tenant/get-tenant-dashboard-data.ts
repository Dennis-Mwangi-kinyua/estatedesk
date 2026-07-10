import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { tenantVisibleWaterBillWhere } from "@/lib/water-bills/status";

export async function getTenantDashboardData(tenantId: string, unitId?: string) {
  const [recentPayments, waterBills, notifications] = await retryTransientDatabaseOperation(
    () =>
      Promise.all([
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
            receipt: {
              select: {
                id: true,
              },
            },
          },
        }),

        prisma.waterBill.findMany({
          where: {
            tenantId,
            ...tenantVisibleWaterBillWhere(),
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
      ]),
    { label: "get-tenant-dashboard-data" },
  );

  const issues = unitId
    ? await retryTransientDatabaseOperation(
        () =>
          prisma.issueTicket.findMany({
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
          }),
        { label: "get-tenant-dashboard-issues" },
      )
    : [];

  return {
    recentPayments,
    waterBills,
    notifications,
    issues,
  };
}