import { Prisma } from "@prisma/client";

export const tenantPaymentsArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        status: "ACTIVE",
        deletedAt: null,
      },
      orderBy: {
        startDate: "desc",
      },
      take: 1,
      select: {
        id: true,
        monthlyRent: true,
      },
    },
    payments: {
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      include: {
        receipt: true,
        rentCharge: {
          include: {
            lease: {
              include: {
                unit: {
                  include: {
                    building: true,
                    property: true,
                  },
                },
              },
            },
          },
        },
        waterBill: {
          include: {
            unit: {
              include: {
                building: true,
                property: true,
              },
            },
          },
        },
      },
    },
  },
});

export type TenantPaymentsResult = Prisma.TenantGetPayload<
  typeof tenantPaymentsArgs
>;
export type PaymentItem = TenantPaymentsResult["payments"][number];

export type TenantPaymentsPageData = {
  tenant: TenantPaymentsResult;
  tenantLedger: Awaited<
    ReturnType<typeof import("@/lib/ledger").getTenantLedger>
  >;
  filteredPayments: PaymentItem[];
  totalPaid: number;
  successfulPayments: PaymentItem[];
  pendingPayments: PaymentItem[];
  verifiedPayments: PaymentItem[];
  totalRentPaid: number;
  totalWaterPaid: number;
  totalServiceChargePaid: number;
  totalGarbagePaid: number;
  latestPayment: PaymentItem | null;
  activeLease: TenantPaymentsResult["leases"][number] | null;
};