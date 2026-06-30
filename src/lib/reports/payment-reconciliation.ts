import "server-only";

import { PaymentReconciliationStatus } from "@prisma/client";
import { buildCsv } from "@/lib/csv";
import {
  assertWithinSyncExportLimit,
  syncExportTake,
} from "@/lib/data-export/limits";
import { getCurrentPeriod } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

function periodWindow(period: string) {
  const [yearValue, monthValue] = period.split("-").map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : new Date().getFullYear();
  const month = Number.isFinite(monthValue) ? monthValue - 1 : new Date().getMonth();

  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
  };
}

export async function buildPaymentReconciliationCsv({
  orgId,
  period = getCurrentPeriod(),
  status,
}: {
  orgId: string;
  period?: string;
  status?: PaymentReconciliationStatus;
}) {
  const { start, end } = periodWindow(period);

  const payments = assertWithinSyncExportLimit(
    "payment reconciliation report",
    await prisma.payment.findMany({
      where: {
        orgId,
        createdAt: {
          gte: start,
          lt: end,
        },
        ...(status ? { reconciliationStatus: status } : {}),
      },
      orderBy: [{ reconciliationStatus: "asc" }, { createdAt: "desc" }],
      take: syncExportTake(),
      select: {
        id: true,
        amount: true,
        method: true,
        targetType: true,
        gatewayStatus: true,
        verificationStatus: true,
        reconciliationStatus: true,
        reconciliationNotes: true,
        reference: true,
        externalReference: true,
        checkoutRequestId: true,
        payerName: true,
        payerType: true,
        paidAt: true,
        createdAt: true,
        reconciledAt: true,
        payerTenant: { select: { fullName: true, phone: true } },
        payerUser: { select: { fullName: true, email: true } },
        reconciledBy: { select: { fullName: true, email: true } },
      },
    }),
  );

  return buildCsv(
    [
      "period",
      "paymentId",
      "payer",
      "payerContact",
      "method",
      "target",
      "amount",
      "gatewayStatus",
      "verificationStatus",
      "reconciliationStatus",
      "reference",
      "paidAt",
      "recordedAt",
      "reconciledAt",
      "reconciledBy",
      "notes",
    ],
    payments.map((payment) => ({
      period,
      paymentId: payment.id,
      payer:
        payment.payerTenant?.fullName ??
        payment.payerUser?.fullName ??
        payment.payerName ??
        payment.payerType,
      payerContact: payment.payerTenant?.phone ?? payment.payerUser?.email ?? "",
      method: payment.method,
      target: payment.targetType,
      amount: Number(payment.amount),
      gatewayStatus: payment.gatewayStatus,
      verificationStatus: payment.verificationStatus,
      reconciliationStatus: payment.reconciliationStatus,
      reference:
        payment.externalReference ?? payment.reference ?? payment.checkoutRequestId ?? "",
      paidAt: payment.paidAt?.toISOString() ?? "",
      recordedAt: payment.createdAt.toISOString(),
      reconciledAt: payment.reconciledAt?.toISOString() ?? "",
      reconciledBy: payment.reconciledBy?.fullName ?? payment.reconciledBy?.email ?? "",
      notes: payment.reconciliationNotes ?? "",
    })),
  );
}

export function parseReconciliationStatus(value: string | null) {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  return Object.values(PaymentReconciliationStatus).find(
    (status) => status === normalized,
  );
}
