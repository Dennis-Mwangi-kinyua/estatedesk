import { getBankAccountWithBalance, getLedgerAccountBalance } from "@/lib/accounting/bank-accounts";
import { getUnclearedJournalLines } from "@/lib/accounting/bank-reconciliation";
import { prisma } from "@/lib/prisma";

export async function getBankPageData(orgId: string, bankAccountId?: string) {
  const now = new Date();
  const [org, bankAccounts, reconciliations] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    prisma.accountingBankAccount.findMany({
      where: { orgId, isActive: true },
      include: {
        ledgerAccount: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.accountingBankReconciliation.findMany({
      where: { orgId },
      include: {
        bankAccount: { select: { id: true, name: true } },
      },
      orderBy: { periodEnd: "desc" },
      take: 12,
    }),
  ]);

  const selectedId = bankAccountId ?? bankAccounts[0]?.id ?? null;
  const selected = selectedId
    ? await getBankAccountWithBalance(prisma, orgId, selectedId, now)
    : null;
  const unclearedLines = selectedId
    ? await getUnclearedJournalLines(prisma, orgId, selectedId, now)
    : [];

  const balances = await Promise.all(
    bankAccounts.map(async (account) => ({
      id: account.id,
      name: account.name,
      glBalance: await getLedgerAccountBalance(prisma, orgId, account.ledgerAccountId, now),
    })),
  );

  return {
    org,
    bankAccounts,
    selected,
    unclearedLines,
    reconciliations,
    balances,
  };
}