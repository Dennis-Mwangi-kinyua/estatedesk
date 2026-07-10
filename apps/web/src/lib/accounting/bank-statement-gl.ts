import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { getLedgerAccountBalance } from "@/lib/accounting/bank-accounts";
import {
  matchStatementRowsToGlLines,
  type GlMatchCandidate,
  type StatementMatchRow,
} from "@/lib/accounting/bank-statement-gl-policy";
import { getUnclearedJournalLines } from "@/lib/accounting/bank-reconciliation";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

export async function importGlBankStatement(input: {
  db: AccountingDb;
  orgId: string;
  bankAccountId: string;
  rows: StatementMatchRow[];
  userId?: string | null;
}) {
  const bankAccount = await input.db.accountingBankAccount.findFirst({
    where: { id: input.bankAccountId, orgId: input.orgId, isActive: true },
    select: { id: true, ledgerAccountId: true },
  });

  if (!bankAccount) {
    throw new Error("Bank account was not found.");
  }

  const periodEnd = input.rows.reduce(
    (latest, row) => (row.paidAt > latest ? row.paidAt : latest),
    input.rows[0]?.paidAt ?? new Date(),
  );

  const uncleared = await getUnclearedJournalLines(
    input.db,
    input.orgId,
    input.bankAccountId,
    periodEnd,
  );

  const candidates: GlMatchCandidate[] = uncleared.map((line) => ({
    id: line.id,
    amount: line.amount,
    entryDate: line.journal.entryDate,
    description: line.journal.description,
    memo: line.description,
  }));

  const { matches, unmatched } = matchStatementRowsToGlLines(input.rows, candidates);
  const glBalance = await getLedgerAccountBalance(
    input.db,
    input.orgId,
    bankAccount.ledgerAccountId,
    periodEnd,
  );

  const reconciliation = await input.db.accountingBankReconciliation.create({
    data: {
      orgId: input.orgId,
      bankAccountId: input.bankAccountId,
      periodEnd,
      statementBalance: glBalance,
      glBalance,
      notes: `Imported ${input.rows.length} statement row(s)`,
      items: {
        create: [
          ...matches.map((match) => ({
            journalLineId: match.journalLineId,
            amount: match.row.amount,
            statementDate: match.row.paidAt,
            statementRef: match.row.transactionId,
            description: match.row.payerName || match.row.transactionId,
            isCleared: true,
          })),
          ...unmatched.map((row) => ({
            amount: row.amount,
            statementDate: row.paidAt,
            statementRef: row.transactionId,
            description: row.payerName || row.transactionId,
            isCleared: false,
          })),
        ],
      },
    },
    include: { items: true },
  });

  return {
    reconciliation,
    matched: matches.length,
    unmatched: unmatched.length,
  };
}