import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { getLedgerAccountBalance } from "@/lib/accounting/bank-accounts";
import { reconciliationVariance } from "@/lib/accounting/budget-policy";

export { reconciliationVariance } from "@/lib/accounting/budget-policy";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

export async function getUnclearedJournalLines(
  db: AccountingDb,
  orgId: string,
  bankAccountId: string,
  asOf: Date,
) {
  const bankAccount = await db.accountingBankAccount.findFirst({
    where: { id: bankAccountId, orgId },
    select: { ledgerAccountId: true },
  });

  if (!bankAccount) {
    throw new Error("Bank account was not found.");
  }

  const clearedLineIds = await db.accountingBankReconciliationItem.findMany({
    where: {
      isCleared: true,
      journalLineId: { not: null },
      reconciliation: {
        orgId,
        bankAccountId,
        status: "COMPLETED",
      },
    },
    select: { journalLineId: true },
  });
  const clearedIds = new Set(
    clearedLineIds
      .map((item) => item.journalLineId)
      .filter((id): id is string => Boolean(id)),
  );

  const lines = await db.accountingJournalLine.findMany({
    where: {
      orgId,
      accountId: bankAccount.ledgerAccountId,
      journal: {
        status: "POSTED",
        entryDate: { lte: asOf },
      },
    },
    include: {
      journal: {
        select: {
          id: true,
          entryNumber: true,
          entryDate: true,
          description: true,
        },
      },
    },
    orderBy: [{ journal: { entryDate: "desc" } }, { createdAt: "desc" }],
    take: 200,
  });

  return lines
    .filter((line) => !clearedIds.has(line.id))
    .map((line) => ({
      ...line,
      amount: Number(line.debit) > 0 ? Number(line.debit) : -Number(line.credit),
    }));
}

export async function createBankReconciliation(input: {
  db: AccountingDb;
  orgId: string;
  bankAccountId: string;
  periodEnd: Date;
  statementBalance: number;
  notes?: string | null;
  clearedJournalLineIds?: string[];
}) {
  const bankAccount = await input.db.accountingBankAccount.findFirst({
    where: { id: input.bankAccountId, orgId: input.orgId, isActive: true },
    select: { ledgerAccountId: true },
  });

  if (!bankAccount) {
    throw new Error("Bank account was not found.");
  }

  const glBalance = await getLedgerAccountBalance(
    input.db,
    input.orgId,
    bankAccount.ledgerAccountId,
    input.periodEnd,
  );

  const clearedLineIds = input.clearedJournalLineIds ?? [];
  const clearedLines =
    clearedLineIds.length > 0
      ? await input.db.accountingJournalLine.findMany({
          where: {
            orgId: input.orgId,
            id: { in: clearedLineIds },
            accountId: bankAccount.ledgerAccountId,
          },
          select: { id: true, debit: true, credit: true },
        })
      : [];

  const reconciliation = await input.db.accountingBankReconciliation.create({
    data: {
      orgId: input.orgId,
      bankAccountId: input.bankAccountId,
      periodEnd: input.periodEnd,
      statementBalance: input.statementBalance,
      glBalance,
      notes: input.notes,
      items: {
        create: clearedLines.map((line) => ({
          journalLineId: line.id,
          amount:
            Number(line.debit) > 0 ? Number(line.debit) : -Number(line.credit),
          isCleared: true,
        })),
      },
    },
    include: { items: true },
  });

  return reconciliation;
}

export async function completeBankReconciliation(
  db: AccountingDb,
  orgId: string,
  reconciliationId: string,
  userId?: string | null,
) {
  const reconciliation = await db.accountingBankReconciliation.findFirst({
    where: { id: reconciliationId, orgId, status: "DRAFT" },
    include: { items: true },
  });

  if (!reconciliation) {
    throw new Error("Draft reconciliation was not found.");
  }

  const variance = reconciliationVariance(
    Number(reconciliation.statementBalance),
    Number(reconciliation.glBalance),
  );

  if (variance.abs().gt(0.01)) {
    throw new Error(
      `Reconciliation is out of balance by ${variance.toFixed(2)}. Adjust the statement balance to match the GL.`,
    );
  }

  await db.$transaction([
    db.accountingBankReconciliation.update({
      where: { id: reconciliation.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedByUserId: userId,
      },
    }),
    db.accountingBankAccount.update({
      where: { id: reconciliation.bankAccountId },
      data: { lastReconciledAt: reconciliation.periodEnd },
    }),
  ]);

  return reconciliation;
}