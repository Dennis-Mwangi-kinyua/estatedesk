import "server-only";

import {
  GatewayStatus,
  VerificationStatus,
  type PrismaClient,
} from "@prisma/client";
import { addMonthsToPeriod, getCurrentPeriod } from "@/lib/ledger";
import { isPayableWaterBillStatus } from "@/lib/water-bills/status";
import type {
  CombinedBill,
  CombinedBillLine,
  InvoiceIssuanceInfo,
  PreviousBillSummary,
  TenantInvoiceResult,
  WaterReadingDetail,
} from "@/app/(app)/dashboard/tenant/invoice/_lib/types";
import {
  tenantInvoiceDownloadPath,
  tenantInvoiceViewPath,
} from "@/app/(app)/dashboard/tenant/invoice/_lib/paths";
import { getPeriodBillForTenant } from "./period-bill";

type MeterReadingRow = {
  period: string;
  prevReading: number;
  currentReading: number;
  unitsUsed: number;
  status: string;
  createdAt: Date;
  approvedAt: Date | null;
  submittedBy: { fullName: string };
  approvedBy: { fullName: string } | null;
};

function isSuccessfulPayment(status: GatewayStatus) {
  return status === "SUCCESS";
}

function isVerifiedOrNotRequired(status: VerificationStatus) {
  return status === "VERIFIED" || status === "NOT_REQUIRED";
}

function getLatestReceiptUrlFromPayments(
  payments: Array<{
    receipt: { id: string } | null;
    gatewayStatus: GatewayStatus;
    verificationStatus: VerificationStatus;
  }>,
) {
  const matchingPayment = payments.find(
    (payment) =>
      isSuccessfulPayment(payment.gatewayStatus) &&
      isVerifiedOrNotRequired(payment.verificationStatus) &&
      payment.receipt,
  );

  return matchingPayment?.receipt
    ? `/dashboard/tenant/receipts/${matchingPayment.receipt.id}`
    : null;
}

function periodBillTypeLabel(lines: CombinedBillLine[]): CombinedBill["typeLabel"] {
  const hasRent = lines.some((line) => line.kind === "RENT");
  const hasWater = lines.some((line) => line.kind === "WATER");
  const hasOther = lines.some((line) => line.kind === "OTHER");

  if (hasRent && hasWater) return "Rent + Water";
  if (hasRent && hasOther) return "Rent";
  if (hasRent) return "Rent";
  if (hasWater) return "Water Bill";
  return "Service Charge";
}

function buildWaterReadingDetail(
  waterBill: TenantInvoiceResult["waterBills"][number],
  reading?: MeterReadingRow,
): WaterReadingDetail {
  return {
    billStatus: waterBill.status.replaceAll("_", " "),
    prevReading: reading?.prevReading ?? 0,
    currentReading: reading?.currentReading ?? 0,
    unitsUsed: Number(waterBill.unitsUsed ?? reading?.unitsUsed ?? 0),
    ratePerUnit: Number(waterBill.ratePerUnit ?? 0),
    fixedCharge: Number(waterBill.fixedCharge ?? 0),
    readingStatus: reading?.status?.replaceAll("_", " ") ?? "NOT SUBMITTED",
    readingSubmittedAt: reading?.createdAt ?? waterBill.createdAt,
    readingApprovedAt: reading?.approvedAt ?? null,
    submittedByName: reading?.submittedBy.fullName ?? null,
    confirmedByName: reading?.approvedBy?.fullName ?? null,
  };
}

function buildIssuanceInfo(
  reading?: MeterReadingRow,
  waterBill?: TenantInvoiceResult["waterBills"][number],
): InvoiceIssuanceInfo | undefined {
  if (!reading && !waterBill) return undefined;

  return {
    submittedByName: reading?.submittedBy.fullName ?? null,
    confirmedByName: reading?.approvedBy?.fullName ?? null,
    confirmedAt: reading?.approvedAt ?? null,
  };
}

function toPreviousBillSummary(bill: CombinedBill): PreviousBillSummary {
  const rentTotal =
    bill.lines?.find((line) => line.kind === "RENT")?.amountDue ?? null;
  const waterTotal =
    bill.lines?.find((line) => line.kind === "WATER")?.amountDue ?? null;

  return {
    period: bill.period,
    amountDue: bill.amountDue,
    amountPaid: bill.amountPaid ?? 0,
    balance: bill.balance,
    waterTotal,
    rentTotal,
    status: bill.status,
  };
}

function periodBillToCombinedBill(
  period: string,
  periodBill: NonNullable<Awaited<ReturnType<typeof getPeriodBillForTenant>>>,
  tenant: TenantInvoiceResult,
  readingByPeriod: Map<string, MeterReadingRow>,
): CombinedBill {
  const activeLease = tenant.leases[0];
  const rentCharge = activeLease?.rentCharges.find(
    (charge) => charge.period === period && charge.chargeType === "RENT",
  );
  const waterBill = tenant.waterBills.find(
    (bill) => bill.period === period && bill.unitId === periodBill.unitId,
  );
  const meterReading = readingByPeriod.get(period);

  const lines: CombinedBillLine[] = periodBill.lines.map((line) => {
    let payHref: string | null = null;
    let waterDetail: WaterReadingDetail | undefined;

    if (line.kind === "RENT" && line.balance > 0 && rentCharge) {
      payHref = `/dashboard/tenant/payments/new?source=rent_charge&id=${rentCharge.id}`;
    } else if (line.kind === "WATER" && line.balance > 0 && periodBill.waterBillId) {
      payHref = `/dashboard/tenant/payments/new?source=water_bill&id=${periodBill.waterBillId}`;
    } else if (line.kind === "OTHER" && line.balance > 0 && !line.id.startsWith("pending-")) {
      payHref = `/dashboard/tenant/payments/new?source=rent_charge&id=${line.id}`;
    }

    if (line.kind === "WATER" && waterBill) {
      waterDetail = buildWaterReadingDetail(waterBill, meterReading);
    }

    return {
      kind: line.kind,
      label: line.label,
      amountDue: line.amountDue,
      amountPaid: line.amountPaid,
      balance: line.balance,
      payHref,
      waterDetail,
    };
  });

  const waterPending = waterBill?.status === "PENDING_APPROVAL";

  let status = "UNPAID";
  if (periodBill.isPaid) status = "PAID";
  else if (periodBill.amountPaid > 0) status = "PARTIAL";
  else if (waterPending && !periodBill.balance) status = "PENDING APPROVAL";

  const canPayCombined = periodBill.balance > 0;
  const waterLine = lines.find((line) => line.kind === "WATER");
  const canPayWaterOnly =
    Boolean(waterLine && waterLine.balance > 0 && periodBill.waterBillId) &&
    Boolean(waterBill && isPayableWaterBillStatus(waterBill.status));

  const receiptUrl =
    getLatestReceiptUrlFromPayments(rentCharge?.payments ?? []) ??
    getLatestReceiptUrlFromPayments(waterBill?.payments ?? []) ??
    null;

  const canDownloadInvoice = Boolean(waterBill) || periodBill.amountDue > 0;

  return {
    id: `period-${period}`,
    source: "PERIOD_BILL",
    typeLabel: periodBillTypeLabel(lines),
    period,
    dueDate: periodBill.dueDate,
    amountDue: periodBill.amountDue,
    amountPaid: periodBill.amountPaid,
    balance: periodBill.balance,
    status,
    rawStatus: status,
    description: lines.map((line) => line.label).join(" + "),
    receiptUrl,
    invoiceUrl: canDownloadInvoice ? tenantInvoiceDownloadPath(period) : null,
    invoiceViewUrl: canDownloadInvoice ? tenantInvoiceViewPath(period) : null,
    isPaid: periodBill.isPaid,
    lines,
    issuance: buildIssuanceInfo(meterReading, waterBill),
    payNowHref: canPayCombined
      ? `/dashboard/tenant/payments/new?source=period_bill&id=${period}`
      : null,
    payWaterHref: canPayWaterOnly && periodBill.waterBillId
      ? `/dashboard/tenant/payments/new?source=water_bill&id=${periodBill.waterBillId}`
      : null,
  };
}

export async function buildTenantInvoiceBills({
  db,
  orgId,
  tenantId,
  tenant,
}: {
  db: PrismaClient;
  orgId: string;
  tenantId: string;
  tenant: TenantInvoiceResult;
}): Promise<CombinedBill[]> {
  const activeLease = tenant.leases[0];
  if (!activeLease) return [];

  const periods = new Set<string>();

  for (const charge of activeLease.rentCharges) {
    periods.add(charge.period);
  }

  for (const bill of tenant.waterBills) {
    periods.add(bill.period);
  }

  periods.add(getCurrentPeriod());

  const meterReadings = await db.meterReading.findMany({
    where: {
      unitId: activeLease.unitId,
      period: { in: Array.from(periods) },
    },
    select: {
      period: true,
      prevReading: true,
      currentReading: true,
      unitsUsed: true,
      status: true,
      createdAt: true,
      approvedAt: true,
      submittedBy: { select: { fullName: true } },
      approvedBy: { select: { fullName: true } },
    },
  });

  const readingByPeriod = new Map(
    meterReadings.map((reading) => [reading.period, reading]),
  );

  const bills: CombinedBill[] = [];

  for (const period of periods) {
    const periodBill = await getPeriodBillForTenant({
      db,
      orgId,
      tenantId,
      period,
      showPendingWater: true,
    });

    if (!periodBill) continue;

    const hasWater = tenant.waterBills.some((bill) => bill.period === period);
    const hasCharges = periodBill.amountDue > 0 || hasWater;

    if (!hasCharges) continue;

    bills.push(
      periodBillToCombinedBill(period, periodBill, tenant, readingByPeriod),
    );
  }

  const sorted = bills.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  const billByPeriod = new Map(sorted.map((bill) => [bill.period, bill]));

  return sorted.map((bill) => {
    const previousPeriod = addMonthsToPeriod(bill.period, -1);
    const previous = billByPeriod.get(previousPeriod);

    return {
      ...bill,
      previousBill: previous ? toPreviousBillSummary(previous) : null,
    };
  });
}