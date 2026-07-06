import { getFinancialSummary } from "@/lib/accounting/reports";
import { prisma } from "@/lib/prisma";

export async function getAccountingPageData(orgId: string) {
  const now = new Date();
  const fiscalYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [
    org,
    accounts,
    vendors,
    journals,
    bills,
    openBills,
    properties,
    currentPeriod,
    verifiedPayments,
    postedPaymentJournals,
  ] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    prisma.accountingAccount.findMany({
      where: { orgId, isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.accountingVendor.findMany({
      where: { orgId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.accountingJournalEntry.findMany({
      where: { orgId },
      include: {
        lines: {
          include: { account: true },
          orderBy: { debit: "desc" },
        },
      },
      orderBy: { entryDate: "desc" },
      take: 15,
    }),
    prisma.accountingVendorBill.findMany({
      where: { orgId },
      include: { vendor: true },
      orderBy: { billDate: "desc" },
      take: 10,
    }),
    prisma.accountingVendorBill.findMany({
      where: {
        orgId,
        status: { in: ["APPROVED", "PARTIAL"] },
      },
      include: { vendor: true },
      orderBy: { dueDate: "asc" },
      take: 12,
    }),
    prisma.property.findMany({
      where: { orgId, deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.accountingPeriod.findFirst({
      where: {
        orgId,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { startsAt: "desc" },
    }),
    prisma.payment.findMany({
      where: {
        orgId,
        verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
      },
      select: {
        id: true,
        amount: true,
        method: true,
        targetType: true,
        paidAt: true,
        createdAt: true,
        payerTenant: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.accountingJournalEntry.findMany({
      where: { orgId, sourceType: "PAYMENT", sourceId: { not: null } },
      select: { sourceId: true },
    }),
  ]);

  const isInitialized = accounts.length > 0;
  const summary = isInitialized
    ? await getFinancialSummary(prisma, orgId, fiscalYearStart, now)
    : null;

  const postedPaymentIds = new Set(
    postedPaymentJournals
      .map((entry) => entry.sourceId)
      .filter((id): id is string => Boolean(id)),
  );

  const unpostedPayments = verifiedPayments
    .filter((payment) => !postedPaymentIds.has(payment.id))
    .slice(0, 8);

  const expenseAccounts = accounts.filter((account) => account.type === "EXPENSE");
  const liabilityAccounts = accounts.filter(
    (account) => account.type === "LIABILITY",
  );

  return {
    org,
    accounts,
    expenseAccounts,
    liabilityAccounts,
    vendors,
    properties,
    journals,
    bills,
    openBills,
    currentPeriod,
    unpostedPayments,
    unpostedPaymentsCount: verifiedPayments.filter(
      (payment) => !postedPaymentIds.has(payment.id),
    ).length,
    summary,
    isInitialized,
    defaultDate: now.toISOString().slice(0, 10),
  };
}