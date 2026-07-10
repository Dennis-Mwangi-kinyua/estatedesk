import { prisma } from "@/lib/prisma";
import { toNumber } from "./helpers";
import type { ChargesPageData } from "./types";

export async function getChargesPageData(orgId: string): Promise<ChargesPageData> {
  const [organization, charges] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    }),
    prisma.rentCharge.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        period: true,
        amountDue: true,
        amountPaid: true,
        balance: true,
        status: true,
        chargeType: true,
        dueDate: true,
        lease: {
          select: {
            id: true,
            startDate: true,
            tenant: {
              select: {
                id: true,
                fullName: true,
              },
            },
            unit: {
              select: {
                houseNo: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                building: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const totalAmountDue = charges.reduce(
    (sum, charge) => sum + toNumber(charge.amountDue),
    0,
  );

  const totalBalance = charges.reduce(
    (sum, charge) => sum + toNumber(charge.balance),
    0,
  );

  return {
    organizationName: organization?.name ?? "Organisation",
    charges,
    stats: {
      totalCharges: charges.length,
      unpaidCharges: charges.filter((charge) => charge.status === "UNPAID").length,
      partialCharges: charges.filter((charge) => charge.status === "PARTIAL").length,
      paidCharges: charges.filter((charge) => charge.status === "PAID").length,
      overdueCharges: charges.filter((charge) => charge.status === "OVERDUE").length,
      totalAmountDue,
      totalBalance,
    },
  };
}