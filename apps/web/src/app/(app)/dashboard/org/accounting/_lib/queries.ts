import {
  buildAgingSummary,
  expenseRatio,
  netMarginPct,
  trialBalanceHealth,
} from "@/lib/accounting/aging";
import { getFinancialSummary } from "@/lib/accounting/reports";
import { getAccountingSettings } from "@/lib/accounting/settings";
import { prisma } from "@/lib/prisma";

export async function getAccountingPageData(orgId: string) {
  const now = new Date();
  const fiscalYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    org,
    settings,
    accounts,
    vendors,
    journals,
    bills,
    openBills,
    properties,
    currentPeriod,
    verifiedPayments,
    postedPaymentJournals,
    openRentCharges,
    journalCountYtd,
    journalCountMonth,
    draftJournals,
  ] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    getAccountingSettings(prisma, orgId),
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
      take: 40,
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
    prisma.rentCharge.findMany({
      where: {
        orgId,
        status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
        balance: { gt: 0 },
      },
      select: {
        id: true,
        period: true,
        chargeType: true,
        balance: true,
        dueDate: true,
        lease: {
          select: {
            tenant: { select: { fullName: true } },
            unit: {
              select: {
                houseNo: true,
                property: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 120,
    }),
    prisma.accountingJournalEntry.count({
      where: {
        orgId,
        status: { in: ["POSTED", "REVERSED"] },
        entryDate: { gte: fiscalYearStart },
      },
    }),
    prisma.accountingJournalEntry.count({
      where: {
        orgId,
        status: { in: ["POSTED", "REVERSED"] },
        entryDate: { gte: monthStart },
      },
    }),
    prisma.accountingJournalEntry.count({
      where: { orgId, status: "DRAFT" },
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

  const unpostedPaymentsCount = verifiedPayments.filter(
    (payment) => !postedPaymentIds.has(payment.id),
  ).length;

  const expenseAccounts = accounts.filter((account) => account.type === "EXPENSE");
  const liabilityAccounts = accounts.filter(
    (account) => account.type === "LIABILITY",
  );

  const arAging = buildAgingSummary(
    openRentCharges.map((charge) => ({
      id: charge.id,
      party: charge.lease.tenant.fullName,
      reference: `${charge.lease.unit.property.name} / ${charge.lease.unit.houseNo} · ${charge.chargeType} · ${charge.period}`,
      dueDate: charge.dueDate,
      balance: Number(charge.balance),
    })),
    now,
  );

  const apAging = buildAgingSummary(
    openBills.map((bill) => ({
      id: bill.id,
      party: bill.vendor.name,
      reference: bill.billNumber,
      dueDate: bill.dueDate,
      balance: Number(bill.total) - Number(bill.amountPaid),
    })),
    now,
  );

  const tb = summary
    ? trialBalanceHealth(summary.rows)
    : { totalDebit: 0, totalCredit: 0, difference: 0, balanced: true };

  const topExpenseAccounts = summary
    ? summary.profitAndLoss.expenses
        .slice()
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 6)
    : [];

  const booksHealth = {
    trialBalance: tb,
    balanceSheetBalanced: summary?.balanceSheet.balanced ?? true,
    periodOpen: currentPeriod?.status === "OPEN",
    periodName: currentPeriod?.name ?? null,
    periodStatus: currentPeriod?.status ?? null,
    unpostedPaymentsCount,
    draftJournals,
    journalCountYtd,
    journalCountMonth,
    expenseRatioPct: summary
      ? expenseRatio(summary.income, summary.expenses)
      : 0,
    netMarginPct: summary
      ? netMarginPct(summary.income, summary.netIncome)
      : 0,
    accountCount: accounts.length,
    vendorCount: vendors.length,
  };

  return {
    org,
    settings,
    accounts,
    expenseAccounts,
    liabilityAccounts,
    vendors,
    properties,
    journals,
    bills,
    openBills: openBills.slice(0, 12),
    currentPeriod,
    unpostedPayments,
    unpostedPaymentsCount,
    summary,
    isInitialized,
    defaultDate: now.toISOString().slice(0, 10),
    arAging,
    apAging,
    booksHealth,
    topExpenseAccounts,
  };
}