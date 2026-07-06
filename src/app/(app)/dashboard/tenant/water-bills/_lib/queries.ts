import { prisma } from "@/lib/prisma";
import {
  formatDate,
  formatMoney,
  getBillStatusLabel,
  getOutstandingAmount,
  getReceiptHref,
  getUnitLabel,
} from "@/app/(app)/dashboard/tenant/water-bills/_lib/helpers";
import {
  HISTORY_PAGE_SIZE,
  tenantWaterBillsArgs,
  type PreparedWaterBill,
  type TenantWaterBillsResult,
  type WaterBillsTotals,
} from "@/app/(app)/dashboard/tenant/water-bills/_lib/types";

function prepareWaterBill(
  bill: TenantWaterBillsResult["waterBills"][number],
): PreparedWaterBill {
  return {
    id: bill.id,
    period: bill.period,
    unitLabel: getUnitLabel(bill),
    dueDateLabel: formatDate(bill.dueDate),
    status: bill.status,
    statusLabel: getBillStatusLabel(bill.status),
    totalLabel: formatMoney(bill.total),
    ratePerUnitLabel: formatMoney(bill.ratePerUnit),
    fixedChargeLabel: formatMoney(bill.fixedCharge),
    outstandingLabel: formatMoney(getOutstandingAmount(bill)),
    unitsUsed: Number(bill.unitsUsed ?? 0),
    notes: bill.notes ?? null,
    receiptHref: getReceiptHref(bill),
  };
}

function computeTotals(
  waterBills: TenantWaterBillsResult["waterBills"],
): WaterBillsTotals {
  return waterBills.reduce(
    (acc, bill) => {
      acc.totalBilled += Number(bill.total ?? 0);
      acc.totalUnitsUsed += Number(bill.unitsUsed ?? 0);
      acc.outstanding += getOutstandingAmount(bill);

      if (bill.status === "PAID_VERIFIED") {
        acc.paidCount += 1;
      }

      return acc;
    },
    {
      totalBilled: 0,
      totalUnitsUsed: 0,
      outstanding: 0,
      paidCount: 0,
    },
  );
}

export async function getTenantWaterBillsData(userId: string, orgId: string) {
  const tenant: TenantWaterBillsResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantWaterBillsArgs,
  });

  const waterBills = tenant?.waterBills ?? [];

  if (!tenant || waterBills.length === 0) {
    return null;
  }

  const preparedBills = waterBills.map(prepareWaterBill);

  return {
    preparedBills,
    latestBill: preparedBills[0] ?? null,
    totals: computeTotals(waterBills),
    totalPages: Math.max(1, Math.ceil(preparedBills.length / HISTORY_PAGE_SIZE)),
  };
}