import {
  ACCOUNTING_ENTRY_TYPES,
  ACCOUNTING_TABS,
  type AccountingEntryType,
  type AccountingTab,
} from "./types";

export function formatMoney(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export const fieldClassName =
  "mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";

export const labelClassName = "block text-sm font-medium text-foreground";

export const buttonPrimaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90";

export const buttonSecondaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted/30";

export function parseAccountingTab(value?: string): AccountingTab {
  if (value && ACCOUNTING_TABS.includes(value as AccountingTab)) {
    return value as AccountingTab;
  }

  return "operations";
}

export function parseAccountingEntryType(value?: string): AccountingEntryType {
  if (value && ACCOUNTING_ENTRY_TYPES.includes(value as AccountingEntryType)) {
    return value as AccountingEntryType;
  }

  return "expense";
}

export function buildAccountingPageHref({
  tab,
  entry,
  message,
}: {
  tab?: AccountingTab;
  entry?: AccountingEntryType;
  message?: string;
} = {}) {
  const params = new URLSearchParams();

  if (tab) {
    params.set("tab", tab);
  }

  if (entry) {
    params.set("entry", entry);
  }

  if (message) {
    params.set("message", message);
  }

  const query = params.toString();

  return query
    ? `/dashboard/org/accounting?${query}`
    : "/dashboard/org/accounting";
}