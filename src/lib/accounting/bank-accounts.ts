import "server-only";

import type { AccountingBankAccountType, Prisma, PrismaClient } from "@prisma/client";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

const DEFAULT_BANK_ACCOUNTS: Array<{
  systemKey: string;
  name: string;
  type: AccountingBankAccountType;
  isDefault: boolean;
}> = [
  { systemKey: "BANK", name: "Primary bank", type: "BANK", isDefault: true },
  { systemKey: "MPESA", name: "M-Pesa float", type: "MPESA", isDefault: false },
  { systemKey: "CASH", name: "Cash on hand", type: "CASH", isDefault: false },
];

export async function ensureDefaultBankAccounts(db: AccountingDb, orgId: string) {
  const ledgerAccounts = await db.accountingAccount.findMany({
    where: {
      orgId,
      systemKey: { in: DEFAULT_BANK_ACCOUNTS.map((account) => account.systemKey) },
      isActive: true,
    },
    select: { id: true, systemKey: true },
  });
  const byKey = new Map(
    ledgerAccounts.map((account) => [account.systemKey, account.id]),
  );

  for (const account of DEFAULT_BANK_ACCOUNTS) {
    const ledgerAccountId = byKey.get(account.systemKey);
    if (!ledgerAccountId) continue;

    await db.accountingBankAccount.upsert({
      where: { orgId_name: { orgId, name: account.name } },
      update: { ledgerAccountId, type: account.type, isActive: true },
      create: {
        orgId,
        ledgerAccountId,
        name: account.name,
        type: account.type,
        isDefault: account.isDefault,
      },
    });
  }
}

export async function getLedgerAccountBalance(
  db: AccountingDb,
  orgId: string,
  ledgerAccountId: string,
  asOf: Date,
) {
  const account = await db.accountingAccount.findFirst({
    where: { id: ledgerAccountId, orgId },
    select: { type: true, normalBalance: true },
  });

  if (!account) {
    throw new Error("Ledger account was not found.");
  }

  const lines = await db.accountingJournalLine.findMany({
    where: {
      orgId,
      accountId: ledgerAccountId,
      journal: {
        status: { in: ["POSTED", "REVERSED"] },
        entryDate: { lte: asOf },
      },
    },
    select: { debit: true, credit: true },
  });

  const debit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit), 0);

  if (account.type === "ASSET" || account.type === "EXPENSE") {
    return debit - credit;
  }

  return credit - debit;
}

export async function getBankAccountWithBalance(
  db: AccountingDb,
  orgId: string,
  bankAccountId: string,
  asOf = new Date(),
) {
  const bankAccount = await db.accountingBankAccount.findFirst({
    where: { id: bankAccountId, orgId },
    include: {
      ledgerAccount: { select: { id: true, code: true, name: true } },
    },
  });

  if (!bankAccount) {
    throw new Error("Bank account was not found.");
  }

  const glBalance = await getLedgerAccountBalance(
    db,
    orgId,
    bankAccount.ledgerAccountId,
    asOf,
  );

  return {
    ...bankAccount,
    glBalance,
    adjustedGlBalance: glBalance + Number(bankAccount.openingBalance),
  };
}