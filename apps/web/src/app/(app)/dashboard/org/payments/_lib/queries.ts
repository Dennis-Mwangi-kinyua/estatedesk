import { getOrgLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

export async function loadPaymentsPageData(orgId: string, q = "") {
  const [ledger, organization] = await Promise.all([
    getOrgLedger(orgId),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, currencyCode: true },
    }),
  ]);
  const periodParams = new URLSearchParams({ period: ledger.period });
  const [yearValue, monthValue] = ledger.period.split("-").map(Number);
  const periodStart = new Date(yearValue, monthValue - 1, 1);
  const periodEnd = new Date(yearValue, monthValue, 1);

  const [
    pendingPayments,
    unreconciledCount,
    disputedCount,
    reconciledThisMonth,
    reconciliationQueue,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        orgId,
        verificationStatus: "PENDING",
        ...(q
          ? {
              OR: [
                { externalReference: { contains: q, mode: "insensitive" } },
                { reference: { contains: q, mode: "insensitive" } },
                { checkoutRequestId: { contains: q, mode: "insensitive" } },
                { payerName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 75,
      select: {
        id: true,
        amount: true,
        method: true,
        payerName: true,
        payerType: true,
        targetType: true,
        gatewayStatus: true,
        verificationStatus: true,
        reference: true,
        externalReference: true,
        checkoutRequestId: true,
        callbackRaw: true,
        paidAt: true,
        createdAt: true,
        payerTenant: { select: { fullName: true } },
        payerUser: { select: { fullName: true } },
      },
    }),
    prisma.payment.count({
      where: {
        orgId,
        verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
        reconciliationStatus: "UNRECONCILED",
      },
    }),
    prisma.payment.count({
      where: {
        orgId,
        reconciliationStatus: "DISPUTED",
      },
    }),
    prisma.payment.count({
      where: {
        orgId,
        reconciliationStatus: "RECONCILED",
        reconciledAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        orgId,
        OR: [
          {
            verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
            reconciliationStatus: "UNRECONCILED",
          },
          { reconciliationStatus: "DISPUTED" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        amount: true,
        method: true,
        payerName: true,
        payerType: true,
        targetType: true,
        gatewayStatus: true,
        verificationStatus: true,
        reconciliationStatus: true,
        reconciliationNotes: true,
        reference: true,
        externalReference: true,
        checkoutRequestId: true,
        paidAt: true,
        createdAt: true,
        payerTenant: { select: { fullName: true } },
        payerUser: { select: { fullName: true } },
      },
    }),
  ]);

  return {
    ledger,
    organizationName: organization?.name ?? "Organisation",
    currencyCode: organization?.currencyCode ?? "KES",
    q,
    pendingPayments,
    unreconciledCount,
    disputedCount,
    reconciledThisMonth,
    reconciliationQueue,
    periodParams,
  };
}