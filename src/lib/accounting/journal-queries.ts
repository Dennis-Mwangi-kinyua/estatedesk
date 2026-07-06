import "server-only";

import type { AccountingJournalStatus, AccountingSourceType, PrismaClient } from "@prisma/client";
import { getFinancialSummary } from "@/lib/accounting/reports";

export type JournalRegisterFilters = {
  q?: string;
  status?: AccountingJournalStatus;
  sourceType?: AccountingSourceType;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

export async function getJournalRegister(
  db: PrismaClient,
  orgId: string,
  filters: JournalRegisterFilters = {},
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100);
  const skip = (page - 1) * pageSize;

  const where = {
    orgId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
    ...(filters.from || filters.to
      ? {
          entryDate: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { description: { contains: filters.q, mode: "insensitive" as const } },
            { entryNumber: { contains: filters.q, mode: "insensitive" as const } },
            { memo: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, journals] = await Promise.all([
    db.accountingJournalEntry.count({ where }),
    db.accountingJournalEntry.findMany({
      where,
      include: {
        lines: {
          include: { account: true },
          orderBy: [{ debit: "desc" }, { credit: "desc" }],
        },
      },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return {
    journals,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAccountLedgerPage(
  db: PrismaClient,
  orgId: string,
  accountId: string,
) {
  const now = new Date();
  const fiscalYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [account, summary, lines, recentJournals] = await Promise.all([
    db.accountingAccount.findFirst({
      where: { id: accountId, orgId },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: {
          where: { isActive: true },
          select: { id: true, code: true, name: true },
          orderBy: { code: "asc" },
        },
      },
    }),
    getFinancialSummary(db, orgId, fiscalYearStart, now),
    db.accountingJournalLine.findMany({
      where: {
        orgId,
        accountId,
        journal: { status: { in: ["POSTED", "REVERSED"] } },
      },
      include: {
        journal: {
          select: {
            id: true,
            entryNumber: true,
            entryDate: true,
            description: true,
            status: true,
            sourceType: true,
          },
        },
      },
      orderBy: [{ journal: { entryDate: "desc" } }, { createdAt: "desc" }],
      take: 80,
    }),
    db.accountingJournalEntry.findMany({
      where: {
        orgId,
        lines: { some: { accountId } },
      },
      include: {
        lines: {
          where: { accountId },
          include: { account: true },
        },
      },
      orderBy: { entryDate: "desc" },
      take: 12,
    }),
  ]);

  if (!account) {
    return null;
  }

  const balanceRow = summary.rows.find((row) => row.code === account.code);

  return {
    account,
    balance: balanceRow?.balance ?? 0,
    lines,
    recentJournals,
  };
}

export function journalsToCsv(
  journals: Awaited<ReturnType<typeof getJournalRegister>>["journals"],
) {
  const header = [
    "Entry number",
    "Date",
    "Status",
    "Source",
    "Description",
    "Account code",
    "Account name",
    "Debit",
    "Credit",
    "Line description",
  ];

  const rows: string[][] = [header];

  for (const journal of journals) {
    for (const line of journal.lines) {
      rows.push([
        journal.entryNumber,
        journal.entryDate.toISOString().slice(0, 10),
        journal.status,
        journal.sourceType,
        journal.description,
        line.account.code,
        line.account.name,
        Number(line.debit).toFixed(2),
        Number(line.credit).toFixed(2),
        line.description ?? "",
      ]);
    }
  }

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}