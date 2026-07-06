import type { getAccountingPageData } from "./queries";

export const ACCOUNTING_TABS = [
  "operations",
  "transactions",
  "payables",
  "ledger",
] as const;

export type AccountingTab = (typeof ACCOUNTING_TABS)[number];

export const ACCOUNTING_ENTRY_TYPES = ["expense", "bill", "journal"] as const;

export type AccountingEntryType = (typeof ACCOUNTING_ENTRY_TYPES)[number];

export type AccountingPageProps = {
  searchParams?: Promise<{
    message?: string;
    tab?: string;
    entry?: string;
  }>;
};

export type AccountingPageData = Awaited<ReturnType<typeof getAccountingPageData>>;