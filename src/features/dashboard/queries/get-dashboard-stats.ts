import {
  BillStatus,
  LeaseStatus,
  TenantStatus,
  TicketStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardStat = {
  label: string;
  value: string;
  helperText?: string;
};

export async function getDashboardStats(): Promise<DashboardStat[]> {
  const [
    totalProperties,
    totalUnits,
    activeTenants,
    openIssues,
    pendingWaterBills,
    paymentsThisMonth,
    occupiedUnits,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.unit.count(),
    prisma.tenant.count({
      where: {
        status: TenantStatus.ACTIVE,
      },
    }),
    prisma.issueTicket.count({
      where: {
        status: {
          in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
        },
      },
    }),
    prisma.waterBill.count({
      where: {
        status: {
          in: [
            BillStatus.ISSUED,
            BillStatus.PAYMENT_PENDING,
            BillStatus.PAID_PENDING_VERIFICATION,
          ],
        },
      },
    }),
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        paidAt: {
          gte: startOfMonth(),
          lte: endOfMonth(),
        },
      },
    }),
    prisma.unit.count({
      where: {
        leases: {
          some: {
            status: LeaseStatus.ACTIVE,
          },
        },
      },
    }),
  ]);

  const vacantUnits = Math.max(totalUnits - occupiedUnits, 0);
  const paymentsTotal = Number(paymentsThisMonth._sum.amount ?? 0);

  return [
    {
      label: "Total Properties",
      value: totalProperties.toLocaleString(),
      helperText: "All registered properties",
    },
    {
      label: "Occupied Units",
      value: occupiedUnits.toLocaleString(),
      helperText: `Vacant: ${vacantUnits.toLocaleString()}`,
    },
    {
      label: "Active Tenants",
      value: activeTenants.toLocaleString(),
      helperText: "Currently active tenants",
    },
    {
      label: "Open Issues",
      value: openIssues.toLocaleString(),
      helperText: "Open and in-progress tickets",
    },
    {
      label: "Pending Water Bills",
      value: pendingWaterBills.toLocaleString(),
      helperText: "Bills awaiting completion",
    },
    {
      label: "Payments This Month",
      value: `KES ${paymentsTotal.toLocaleString()}`,
      helperText: "Collected this month",
    },
  ];
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function endOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}