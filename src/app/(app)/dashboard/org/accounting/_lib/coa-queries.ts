import { getFinancialSummary } from "@/lib/accounting/reports";
import { ACCOUNT_TYPE_ORDER } from "@/lib/accounting/accounts";
import { prisma } from "@/lib/prisma";

export async function getChartOfAccountsPageData(orgId: string) {
  const now = new Date();
  const fiscalYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [org, accounts, summary] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    prisma.accountingAccount.findMany({
      where: { orgId },
      include: {
        parent: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    }),
    getFinancialSummary(prisma, orgId, fiscalYearStart, now),
  ]);

  const balanceByCode = new Map(summary.rows.map((row) => [row.code, row.balance]));

  const grouped = ACCOUNT_TYPE_ORDER.map((type) => ({
    type,
    accounts: accounts
      .filter((account) => account.type === type)
      .map((account) => ({
        ...account,
        balance: balanceByCode.get(account.code) ?? 0,
      })),
  })).filter((group) => group.accounts.length > 0);

  return {
    org,
    accounts,
    grouped,
    parentOptions: accounts.filter((account) => account.isActive),
    isInitialized: accounts.length > 0,
  };
}