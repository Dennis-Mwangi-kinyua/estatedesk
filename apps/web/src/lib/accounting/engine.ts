import "server-only";

import {
  AccountingJournalStatus,
  AccountingSourceType,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import { ensureDefaultBankAccounts } from "@/lib/accounting/bank-accounts";
import { ensureFiscalYearPeriods } from "@/lib/accounting/periods";
import { ensureAccountingSettings, getAccountingSettings } from "@/lib/accounting/settings";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

const DEFAULT_ACCOUNTS = [
  ["1000", "Bank", "ASSET", "DEBIT", "BANK", true],
  ["1010", "M-Pesa", "ASSET", "DEBIT", "MPESA", true],
  ["1020", "Cash on hand", "ASSET", "DEBIT", "CASH", true],
  ["1100", "Tenant receivables", "ASSET", "DEBIT", "TENANT_RECEIVABLES", true],
  ["2000", "Accounts payable", "LIABILITY", "CREDIT", "ACCOUNTS_PAYABLE", true],
  ["2100", "Tenant deposits held", "LIABILITY", "CREDIT", "TENANT_DEPOSITS", true],
  ["2200", "Owner funds payable", "LIABILITY", "CREDIT", "OWNER_PAYABLE", true],
  ["2300", "Tax payable", "LIABILITY", "CREDIT", "TAX_PAYABLE", true],
  ["3000", "Opening balance equity", "EQUITY", "CREDIT", "OPENING_EQUITY", true],
  ["3100", "Retained earnings", "EQUITY", "CREDIT", "RETAINED_EARNINGS", true],
  ["4000", "Rental income", "INCOME", "CREDIT", "RENT_INCOME", false],
  ["4100", "Water income", "INCOME", "CREDIT", "WATER_INCOME", false],
  ["4200", "Service charge income", "INCOME", "CREDIT", "SERVICE_INCOME", false],
  ["4900", "Other income", "INCOME", "CREDIT", "OTHER_INCOME", false],
  ["5000", "Repairs and maintenance", "EXPENSE", "DEBIT", "REPAIRS_EXPENSE", false],
  ["5100", "Utilities expense", "EXPENSE", "DEBIT", "UTILITIES_EXPENSE", false],
  ["5200", "Management and professional fees", "EXPENSE", "DEBIT", "MANAGEMENT_EXPENSE", false],
  ["5300", "Taxes and licences", "EXPENSE", "DEBIT", "TAX_EXPENSE", false],
  ["5900", "Other operating expenses", "EXPENSE", "DEBIT", "OTHER_EXPENSE", false],
] as const;

export type JournalLineInput = {
  accountId?: string;
  systemKey?: string;
  description?: string;
  debit?: number | string | Prisma.Decimal;
  credit?: number | string | Prisma.Decimal;
  propertyId?: string | null;
  unitId?: string | null;
  tenantId?: string | null;
  vendorId?: string | null;
  landlordId?: string | null;
};

export async function ensureAccountingFoundation(db: AccountingDb, orgId: string, fiscalDate = new Date()) {
  await ensureAccountingSettings(db, orgId, { initializedAt: new Date() });

  for (const [code, name, type, normalBalance, systemKey, isControl] of DEFAULT_ACCOUNTS) {
    await db.accountingAccount.upsert({
      where: { orgId_code: { orgId, code } },
      update: { name, type, normalBalance, systemKey, isControl },
      create: { orgId, code, name, type, normalBalance, systemKey, isControl },
    });
  }

  const settings = await getAccountingSettings(db, orgId);
  const fiscalYear =
    fiscalDate.getUTCMonth() + 1 >= settings.fiscalYearStartMonth
      ? fiscalDate.getUTCFullYear()
      : fiscalDate.getUTCFullYear() - 1;

  await ensureFiscalYearPeriods(db, orgId, fiscalYear, settings.fiscalYearStartMonth);
  await ensureDefaultBankAccounts(db, orgId);
}

function money(value: JournalLineInput["debit"]) {
  return new Prisma.Decimal(value ?? 0).toDecimalPlaces(2);
}

async function resolveJournalLines(db: AccountingDb, orgId: string, lines: JournalLineInput[]) {
  if (lines.length < 2) throw new Error("A journal entry requires at least two lines.");

  const debits = lines.reduce((sum, line) => sum.add(money(line.debit)), new Prisma.Decimal(0));
  const credits = lines.reduce((sum, line) => sum.add(money(line.credit)), new Prisma.Decimal(0));
  if (debits.lte(0) || !debits.equals(credits)) {
    throw new Error(`Journal is not balanced: debits ${debits.toFixed(2)}, credits ${credits.toFixed(2)}.`);
  }

  for (const line of lines) {
    const debit = money(line.debit);
    const credit = money(line.credit);
    if (
      debit.isNegative() ||
      credit.isNegative() ||
      (debit.gt(0) && credit.gt(0)) ||
      (debit.isZero() && credit.isZero())
    ) {
      throw new Error("Each journal line must contain one positive debit or credit.");
    }
  }

  const systemKeys = lines.flatMap((line) => (line.systemKey ? [line.systemKey] : []));
  const accounts = await db.accountingAccount.findMany({
    where: { orgId, systemKey: { in: systemKeys } },
  });
  const byKey = new Map(accounts.map((account) => [account.systemKey, account.id]));
  const resolved = lines.map((line) => {
    const accountId = line.accountId ?? (line.systemKey ? byKey.get(line.systemKey) : undefined);
    if (!accountId) {
      throw new Error(`Accounting account ${line.systemKey ?? "unknown"} was not found.`);
    }
    return { ...line, accountId };
  });
  const resolvedAccountIds = [...new Set(resolved.map((line) => line.accountId))];
  const ownedAccountCount = await db.accountingAccount.count({
    where: { orgId, id: { in: resolvedAccountIds }, isActive: true },
  });
  if (ownedAccountCount !== resolvedAccountIds.length) {
    throw new Error("A journal account is inactive or belongs to another organization.");
  }

  return resolved;
}

function buildEntryNumber(entryDate: Date) {
  const serial = `${entryDate.getUTCFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  return `JE-${serial}`;
}

export async function createJournalEntry(input: {
  db: AccountingDb;
  orgId: string;
  entryDate: Date;
  description: string;
  memo?: string | null;
  sourceType: AccountingSourceType;
  sourceId?: string | null;
  userId?: string | null;
  status?: AccountingJournalStatus;
  lines: JournalLineInput[];
}) {
  const { db, orgId } = input;
  const status = input.status ?? "POSTED";

  if (input.sourceId) {
    const existing = await db.accountingJournalEntry.findUnique({
      where: {
        orgId_sourceType_sourceId: {
          orgId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        },
      },
      include: { lines: true },
    });
    if (existing) return existing;
  }

  const resolved = await resolveJournalLines(db, orgId, input.lines);
  await ensureAccountingFoundation(db, orgId, input.entryDate);

  let periodId: string | null = null;
  if (status === "POSTED") {
    const period = await db.accountingPeriod.findFirst({
      where: {
        orgId,
        startsAt: { lte: input.entryDate },
        endsAt: { gte: input.entryDate },
      },
      orderBy: { startsAt: "desc" },
    });
    const isPeriodClose =
      input.sourceType === "ADJUSTMENT" &&
      Boolean(input.sourceId?.startsWith("period-close:"));

    if (!period) {
      throw new Error("No accounting period covers this entry date.");
    }
    if (period.status === "CLOSED" && !isPeriodClose) {
      throw new Error("The accounting period is closed.");
    }
    if (period.status === "LOCKED" && !isPeriodClose) {
      throw new Error("The accounting period is locked.");
    }
    periodId = period.id;
  }

  return db.accountingJournalEntry.create({
    data: {
      orgId,
      periodId,
      entryNumber: buildEntryNumber(input.entryDate),
      entryDate: input.entryDate,
      description: input.description,
      memo: input.memo,
      status,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      postedAt: status === "POSTED" ? new Date() : null,
      postedByUserId: status === "POSTED" ? input.userId : null,
      createdByUserId: input.userId,
      lines: {
        create: resolved.map((line) => ({
          orgId,
          accountId: line.accountId,
          description: line.description,
          debit: money(line.debit),
          credit: money(line.credit),
          propertyId: line.propertyId,
          unitId: line.unitId,
          tenantId: line.tenantId,
          vendorId: line.vendorId,
          landlordId: line.landlordId,
        })),
      },
    },
    include: { lines: true },
  });
}

export async function postJournalEntry(input: {
  db: AccountingDb;
  orgId: string;
  entryDate: Date;
  description: string;
  memo?: string | null;
  sourceType: AccountingSourceType;
  sourceId?: string | null;
  userId?: string | null;
  lines: JournalLineInput[];
}) {
  return createJournalEntry({ ...input, status: "POSTED" });
}

export async function postDraftJournalEntry(
  db: AccountingDb,
  journalId: string,
  orgId: string,
  userId?: string | null,
) {
  const draft = await db.accountingJournalEntry.findFirst({
    where: { id: journalId, orgId, status: "DRAFT" },
    include: { lines: true },
  });

  if (!draft) {
    throw new Error("Draft journal entry was not found.");
  }

  const period = await db.accountingPeriod.findFirst({
    where: {
      orgId,
      startsAt: { lte: draft.entryDate },
      endsAt: { gte: draft.entryDate },
    },
    orderBy: { startsAt: "desc" },
  });

  if (!period) {
    throw new Error("No accounting period covers this entry date.");
  }
  if (period.status === "CLOSED") {
    throw new Error("The accounting period is closed.");
  }
  if (period.status === "LOCKED") {
    throw new Error("The accounting period is locked.");
  }

  return db.accountingJournalEntry.update({
    where: { id: draft.id },
    data: {
      status: "POSTED",
      periodId: period.id,
      postedAt: new Date(),
      postedByUserId: userId,
    },
    include: { lines: true },
  });
}

export async function reverseJournalEntry(input: {
  db: AccountingDb;
  orgId: string;
  sourceEntryId: string;
  sourceId: string;
  reason: string;
  userId?: string | null;
}) {
  const original = await input.db.accountingJournalEntry.findFirst({
    where: { id: input.sourceEntryId, orgId: input.orgId, status: "POSTED" },
    include: { lines: true },
  });
  if (!original) throw new Error("Posted journal entry was not found.");
  const reversal = await postJournalEntry({
    db: input.db,
    orgId: input.orgId,
    entryDate: new Date(),
    description: `Reversal: ${original.description}`,
    memo: input.reason,
    sourceType: "PAYMENT_REVERSAL",
    sourceId: input.sourceId,
    userId: input.userId,
    lines: original.lines.map((line) => ({
      accountId: line.accountId,
      description: input.reason,
      debit: line.credit,
      credit: line.debit,
      propertyId: line.propertyId,
      unitId: line.unitId,
      tenantId: line.tenantId,
      vendorId: line.vendorId,
      landlordId: line.landlordId,
    })),
  });
  await input.db.accountingJournalEntry.update({ where: { id: original.id }, data: { status: "REVERSED" } });
  await input.db.accountingJournalEntry.update({ where: { id: reversal.id }, data: { reversalOfId: original.id } });
  return reversal;
}

export async function reverseManualJournalEntry(input: {
  db: AccountingDb;
  orgId: string;
  journalId: string;
  reason: string;
  userId?: string | null;
}) {
  const original = await input.db.accountingJournalEntry.findFirst({
    where: {
      id: input.journalId,
      orgId: input.orgId,
      status: "POSTED",
      sourceType: { in: ["MANUAL", "ADJUSTMENT"] },
    },
    include: { lines: true },
  });

  if (!original) {
    throw new Error("Only posted manual journals can be reversed.");
  }

  const reversal = await postJournalEntry({
    db: input.db,
    orgId: input.orgId,
    entryDate: new Date(),
    description: `Reversal: ${original.description}`,
    memo: input.reason,
    sourceType: "ADJUSTMENT",
    sourceId: `${original.id}:reversal:${Date.now()}`,
    userId: input.userId,
    lines: original.lines.map((line) => ({
      accountId: line.accountId,
      description: input.reason,
      debit: line.credit,
      credit: line.debit,
      propertyId: line.propertyId,
      unitId: line.unitId,
      tenantId: line.tenantId,
      vendorId: line.vendorId,
      landlordId: line.landlordId,
    })),
  });

  await input.db.accountingJournalEntry.update({
    where: { id: original.id },
    data: { status: "REVERSED" },
  });
  await input.db.accountingJournalEntry.update({
    where: { id: reversal.id },
    data: { reversalOfId: original.id },
  });

  return reversal;
}
