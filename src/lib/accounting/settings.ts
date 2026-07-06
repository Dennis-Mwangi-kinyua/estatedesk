import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import {
  DEFAULT_ACCOUNTING_POLICY,
  type AccountingPolicy,
  usesAccrualRecognition,
} from "@/lib/accounting/policy";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

export type AccountingSettingsRecord = AccountingPolicy;

const DEFAULT_SETTINGS = DEFAULT_ACCOUNTING_POLICY;

export { usesAccrualRecognition };

export async function getAccountingSettings(
  db: AccountingDb,
  orgId: string,
): Promise<AccountingSettingsRecord> {
  const settings = await db.accountingSettings.findUnique({
    where: { orgId },
    select: {
      recognitionMode: true,
      fiscalYearStartMonth: true,
      autoPostPayments: true,
      autoPostBilling: true,
      ownerStatementEmailEnabled: true,
      ownerStatementEmailDayOfMonth: true,
      ownerStatementLastSentAt: true,
      initializedAt: true,
    },
  });

  return settings ?? DEFAULT_SETTINGS;
}

export async function ensureAccountingSettings(
  db: AccountingDb,
  orgId: string,
  overrides?: Partial<AccountingSettingsRecord>,
) {
  return db.accountingSettings.upsert({
    where: { orgId },
    update: {
      ...(overrides?.recognitionMode
        ? { recognitionMode: overrides.recognitionMode }
        : {}),
      ...(overrides?.fiscalYearStartMonth
        ? { fiscalYearStartMonth: overrides.fiscalYearStartMonth }
        : {}),
      ...(overrides?.autoPostPayments !== undefined
        ? { autoPostPayments: overrides.autoPostPayments }
        : {}),
      ...(overrides?.autoPostBilling !== undefined
        ? { autoPostBilling: overrides.autoPostBilling }
        : {}),
      ...(overrides?.ownerStatementEmailEnabled !== undefined
        ? { ownerStatementEmailEnabled: overrides.ownerStatementEmailEnabled }
        : {}),
      ...(overrides?.ownerStatementEmailDayOfMonth
        ? { ownerStatementEmailDayOfMonth: overrides.ownerStatementEmailDayOfMonth }
        : {}),
      ...(overrides?.ownerStatementLastSentAt !== undefined
        ? { ownerStatementLastSentAt: overrides.ownerStatementLastSentAt }
        : {}),
      ...(overrides?.initializedAt
        ? { initializedAt: overrides.initializedAt }
        : {}),
    },
    create: {
      orgId,
      recognitionMode: overrides?.recognitionMode ?? DEFAULT_SETTINGS.recognitionMode,
      fiscalYearStartMonth:
        overrides?.fiscalYearStartMonth ?? DEFAULT_SETTINGS.fiscalYearStartMonth,
      autoPostPayments:
        overrides?.autoPostPayments ?? DEFAULT_SETTINGS.autoPostPayments,
      autoPostBilling: overrides?.autoPostBilling ?? DEFAULT_SETTINGS.autoPostBilling,
      ownerStatementEmailEnabled:
        overrides?.ownerStatementEmailEnabled ?? DEFAULT_SETTINGS.ownerStatementEmailEnabled,
      ownerStatementEmailDayOfMonth:
        overrides?.ownerStatementEmailDayOfMonth ??
        DEFAULT_SETTINGS.ownerStatementEmailDayOfMonth,
      ownerStatementLastSentAt:
        overrides?.ownerStatementLastSentAt ?? DEFAULT_SETTINGS.ownerStatementLastSentAt,
      initializedAt: overrides?.initializedAt ?? new Date(),
    },
  });
}

