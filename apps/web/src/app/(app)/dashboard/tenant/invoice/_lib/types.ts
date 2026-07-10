import { Prisma } from "@prisma/client";

export const tenantInvoiceArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    org: {
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
      },
    },
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
      where: {
        status: { not: "CANCELLED" },
      },
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

export type PreviousBillSummary = {
  period: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  waterTotal: number | null;
  rentTotal: number | null;
  status: string;
};

export type WaterReadingDetail = {
  billStatus: string;
  prevReading: number;
  currentReading: number;
  unitsUsed: number;
  ratePerUnit: number;
  fixedCharge: number;
  readingStatus: string;
  readingSubmittedAt: Date;
  readingApprovedAt: Date | null;
  submittedByName: string | null;
  confirmedByName: string | null;
};

export type InvoiceIssuanceInfo = {
  submittedByName: string | null;
  confirmedByName: string | null;
  confirmedAt: Date | null;
};

export type CombinedBillLine = {
  kind: "RENT" | "WATER" | "OTHER";
  label: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  /** Pay this line item only (water bill, rent charge, etc.). */
  payHref?: string | null;
  waterDetail?: WaterReadingDetail;
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
  invoiceUrl: string | null;
  /** In-app HTML invoice preview (no download required). */
  invoiceViewUrl: string | null;
  payNowHref: string | null;
  /** Pay only the water portion of a combined period bill. */
  payWaterHref?: string | null;
  isPaid: boolean;
  /** Line items when source is PERIOD_BILL (rent + water combined). */
  lines?: CombinedBillLine[];
  issuance?: InvoiceIssuanceInfo;
  previousBill?: PreviousBillSummary | null;
};

export type TenantInvoicePageData = {
  tenant: TenantInvoiceResult | null;
  tenantName: string;
  organizationName: string;
  unit: TenantInvoiceResult["leases"][number]["unit"] | undefined;
  bills: CombinedBill[];
  totalBilled: number;
  totalBalance: number;
  totalRent: number;
  totalWater: number;
  totalServiceCharge: number;
  totalGarbage: number;
};