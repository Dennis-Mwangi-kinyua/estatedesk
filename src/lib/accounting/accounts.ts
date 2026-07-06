import type { AccountingAccountType, AccountingBalanceSide } from "@prisma/client";

export const ACCOUNT_TYPE_ORDER: AccountingAccountType[] = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
];

export function normalBalanceForAccountType(
  type: AccountingAccountType,
): AccountingBalanceSide {
  if (type === "ASSET" || type === "EXPENSE") {
    return "DEBIT";
  }

  return "CREDIT";
}

export function isLockedSystemAccount(account: {
  systemKey: string | null;
  isControl: boolean;
}) {
  return Boolean(account.systemKey && account.isControl);
}

export function canDeactivateAccount(account: {
  systemKey: string | null;
  isControl: boolean;
}) {
  return !isLockedSystemAccount(account);
}

export function normalizeAccountCode(code: string) {
  return code.trim().toUpperCase();
}

export function validateAccountCode(code: string) {
  const normalized = normalizeAccountCode(code);
  if (!/^[0-9A-Z]{3,12}$/.test(normalized)) {
    throw new Error("Account code must be 3–12 characters using letters and numbers.");
  }

  return normalized;
}