import { Prisma } from "@prisma/client";
import { tenantVisibleWaterBillWhere } from "@/lib/water-bills/status";

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
      where: tenantVisibleWaterBillWhere(),
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

export type CombinedBillLine = {
  kind: "RENT" | "WATER" | "OTHER";
  label: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
};

export type CombinedBill = {
  id: string;
  source: "RENT_CHARGE" | "WATER_BILL" | "PERIOD_BILL";
  typeLabel: "Rent" | "Water Bill" | "Service Charge" | "Garbage" | "Rent + Water";
  period: string;
  dueDate: Date;
  amountDue: number;
  amountPaid?: number;
  balance: number;
  status: string;
  rawStatus: string;
  description?: string | null;
  receiptUrl: string | null;
  payNowHref: string | null;
  isPaid: boolean;
  /** Line items when source is PERIOD_BILL (rent + water combined). */
  lines?: CombinedBillLine[];
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