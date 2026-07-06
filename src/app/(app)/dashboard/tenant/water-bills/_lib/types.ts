import { BillStatus, Prisma } from "@prisma/client";

export type TenantWaterBillsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export const tenantWaterBillsArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    waterBills: {
      orderBy: {
        dueDate: "desc",
      },
      take: 60,
      include: {
        unit: {
          include: {
            building: true,
            property: true,
          },
        },
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

export type TenantWaterBillsResult = Prisma.TenantGetPayload<
  typeof tenantWaterBillsArgs
>;
export type WaterBillItem = TenantWaterBillsResult["waterBills"][number];

export type PreparedWaterBill = {
  id: string;
  period: string;
  unitLabel: string;
  dueDateLabel: string;
  status: BillStatus;
  statusLabel: string;
  totalLabel: string;
  ratePerUnitLabel: string;
  fixedChargeLabel: string;
  outstandingLabel: string;
  unitsUsed: number;
  notes: string | null;
  receiptHref: string | null;
};

export type WaterBillsTotals = {
  totalBilled: number;
  totalUnitsUsed: number;
  outstanding: number;
  paidCount: number;
};

export const HISTORY_PAGE_SIZE = 10;
export const RECENT_BILLS_COUNT = 6;