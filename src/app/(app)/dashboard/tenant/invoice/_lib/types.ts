import { Prisma } from "@prisma/client";

export const tenantInvoiceArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        startDate: "desc",
      },
      take: 1,
      include: {
        unit: {
          include: {
            building: true,
            property: true,
          },
        },
        rentCharges: {
          orderBy: {
            dueDate: "desc",
          },
          take: 24,
          include: {
            payments: {
              orderBy: {
                createdAt: "desc",
              },
              include: {
                receipt: true,
              },
            },
          },
        },
      },
    },
    waterBills: {
      orderBy: {
        dueDate: "desc",
      },
      take: 24,
      include: {
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            receipt: true,
          },
        },
      },
    },
  },
});

export type TenantInvoiceResult = Prisma.TenantGetPayload<typeof tenantInvoiceArgs>;

export type CombinedBill = {
  id: string;
  source: "RENT_CHARGE" | "WATER_BILL";
  typeLabel: "Rent" | "Water Bill" | "Service Charge" | "Garbage";
  period: string;
  dueDate: Date;
  amountDue: number;
  balance: number;
  status: string;
  rawStatus: string;
  description?: string | null;
  receiptUrl: string | null;
  payNowHref: string | null;
  isPaid: boolean;
};

export type TenantInvoicePageData = {
  tenant: TenantInvoiceResult | null;
  tenantName: string;
  unit: TenantInvoiceResult["leases"][number]["unit"] | undefined;
  bills: CombinedBill[];
  totalBilled: number;
  totalBalance: number;
  totalRent: number;
  totalWater: number;
  totalServiceCharge: number;
  totalGarbage: number;
};