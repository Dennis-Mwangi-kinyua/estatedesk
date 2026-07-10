import { Prisma } from "@prisma/client";
import {
  getPaymentMethodDefinition,
  isBankCatalogMethod,
  isKnownPaymentMethodId,
  matchBankNameToMethodId,
  PAYMENT_METHOD_CATALOG,
  type PaymentMethodDefinition,
} from "./methods-catalog";

export type OrgBankAccountDetails = {
  accountName: string;
  accountNumber: string;
  branch: string;
  instructions: string;
  businessName: string;
};

export type PaymentInstructions = {
  /** Method ids tenants may use (org-scoped). Empty falls back to legacy flags. */
  enabledMethods: string[];
  mpesaEnabled: boolean;
  mpesaBusinessName: string;
  mpesaPaybill: string;
  mpesaTillNumber: string;
  mpesaAccountNumber: string;
  mpesaInstructions: string;
  /** KCB M-Pesa paybill rail (e.g. 522522 + org account number). */
  kcbPaybillEnabled: boolean;
  kcbBusinessName: string;
  kcbPaybill: string;
  kcbAccountNumber: string;
  kcbAccountName: string;
  kcbInstructions: string;
  /** Per-bank account details keyed by catalog method id (equity, family, coop, …). */
  bankAccounts: Record<string, OrgBankAccountDetails>;
  /** @deprecated Prefer enabledMethods + bankAccounts. Kept for backward compat. */
  bankEnabled: boolean;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankInstructions: string;
  /** Optional notes for methods without structured fields (e.g. airtel-money). */
  methodNotes: Record<string, string>;
  /** Airtel Money destination details when enabled. */
  airtelBusinessName: string;
  airtelNumber: string;
  airtelInstructions: string;
};

export const emptyBankAccountDetails: OrgBankAccountDetails = {
  accountName: "",
  accountNumber: "",
  branch: "",
  instructions: "",
  businessName: "",
};

export const emptyPaymentInstructions: PaymentInstructions = {
  enabledMethods: [],
  mpesaEnabled: false,
  mpesaBusinessName: "",
  mpesaPaybill: "",
  mpesaTillNumber: "",
  mpesaAccountNumber: "",
  mpesaInstructions: "",
  kcbPaybillEnabled: false,
  kcbBusinessName: "",
  kcbPaybill: "",
  kcbAccountNumber: "",
  kcbAccountName: "",
  kcbInstructions: "",
  bankAccounts: {},
  bankEnabled: false,
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankBranch: "",
  bankInstructions: "",
  methodNotes: {},
  airtelBusinessName: "",
  airtelNumber: "",
  airtelInstructions: "",
};

/** Common KCB Bank Kenya Lipa na M-Pesa paybill for deposits to KCB accounts. */
export const DEFAULT_KCB_PAYBILL = "522522";

function asObject(
  value: Prisma.JsonValue | null | undefined,
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

function getString(source: Record<string, Prisma.JsonValue>, key: string) {
  return typeof source[key] === "string" ? source[key] : "";
}

function getBoolean(source: Record<string, Prisma.JsonValue>, key: string) {
  return typeof source[key] === "boolean" ? source[key] : false;
}

function parseStringArray(value: Prisma.JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBankAccounts(
  value: Prisma.JsonValue | undefined,
): Record<string, OrgBankAccountDetails> {
  const source = asObject(value);
  const result: Record<string, OrgBankAccountDetails> = {};

  for (const [methodId, raw] of Object.entries(source)) {
    const row = asObject(raw);
    result[methodId] = {
      accountName: getString(row, "accountName"),
      accountNumber: getString(row, "accountNumber"),
      branch: getString(row, "branch"),
      instructions: getString(row, "instructions"),
      businessName: getString(row, "businessName"),
    };
  }

  return result;
}

function parseMethodNotes(
  value: Prisma.JsonValue | undefined,
): Record<string, string> {
  const source = asObject(value);
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(source)) {
    if (typeof item === "string") result[key] = item;
  }
  return result;
}

/**
 * Resolve which method ids this org accepts.
 * Prefer explicit `enabledMethods`; fall back to legacy boolean flags.
 */
export function resolveEnabledMethods(
  instructions: PaymentInstructions,
): string[] {
  if (instructions.enabledMethods.length > 0) {
    return [...new Set(instructions.enabledMethods)];
  }

  const legacy: string[] = [];
  if (instructions.mpesaEnabled) legacy.push("mpesa");
  if (instructions.kcbPaybillEnabled) legacy.push("kcb");
  if (instructions.bankEnabled) {
    const matched = matchBankNameToMethodId(instructions.bankName);
    if (matched) {
      legacy.push(matched === "kcb-transfer" ? "kcb-transfer" : matched);
    } else if (instructions.bankName.trim()) {
      // Unknown bank name — still surface generic bank transfer under first free-text
      legacy.push("bank-other");
    }
  }
  return [...new Set(legacy)];
}

export function getBankAccountForMethod(
  instructions: PaymentInstructions,
  methodId: string,
): OrgBankAccountDetails | null {
  const direct = instructions.bankAccounts[methodId];
  if (direct?.accountNumber.trim()) return direct;

  // Legacy single bank account
  if (
    instructions.bankEnabled &&
    instructions.bankAccountNumber.trim() &&
    (matchBankNameToMethodId(instructions.bankName) === methodId ||
      methodId === "bank-other" ||
      methodId === "kcb-transfer")
  ) {
    return {
      accountName: instructions.bankAccountName,
      accountNumber: instructions.bankAccountNumber,
      branch: instructions.bankBranch,
      instructions: instructions.bankInstructions,
      businessName: instructions.bankName,
    };
  }

  return direct ?? null;
}

function hasMpesaPayTarget(instructions: PaymentInstructions) {
  return Boolean(
    instructions.mpesaPaybill.trim() || instructions.mpesaTillNumber.trim(),
  );
}

function hasAnyBankTarget(instructions: PaymentInstructions) {
  if (
    instructions.bankEnabled &&
    instructions.bankAccountNumber.trim() &&
    instructions.bankAccountName.trim()
  ) {
    return true;
  }
  return Object.values(instructions.bankAccounts).some(
    (account) =>
      account.accountNumber.trim() && account.accountName.trim(),
  );
}

/** True when the method is enabled and has enough details for tenants to pay. */
export function isPaymentMethodAvailable(
  instructions: PaymentInstructions,
  methodId: string,
): boolean {
  // Virtual methods derived from org pay targets (shown on the eCitizen-style chooser).
  if (methodId === "mpesa-stk") {
    // STK env check is applied by the tenant chooser (server); here we only need pay targets.
    return hasMpesaPayTarget(instructions);
  }
  if (methodId === "manual-mpesa") {
    return (
      hasMpesaPayTarget(instructions) ||
      Boolean(
        instructions.kcbPaybill.trim() && instructions.kcbAccountNumber.trim(),
      )
    );
  }
  if (methodId === "manual-bank") {
    return hasAnyBankTarget(instructions);
  }

  const enabled = resolveEnabledMethods(instructions);
  if (!enabled.includes(methodId)) return false;

  if (methodId === "mpesa") {
    return hasMpesaPayTarget(instructions);
  }

  if (methodId === "kcb") {
    return Boolean(
      instructions.kcbPaybill.trim() && instructions.kcbAccountNumber.trim(),
    );
  }

  if (methodId === "airtel-money") {
    return Boolean(instructions.airtelNumber.trim());
  }

  if (isBankCatalogMethod(methodId) || methodId === "kcb-transfer" || methodId === "bank-other") {
    const account = getBankAccountForMethod(instructions, methodId);
    return Boolean(account?.accountNumber.trim() && account?.accountName.trim());
  }

  return isKnownPaymentMethodId(methodId);
}

export function listAvailablePaymentMethods(
  instructions: PaymentInstructions,
  options?: { includeStk?: boolean },
): PaymentMethodDefinition[] {
  const enabled = resolveEnabledMethods(instructions);
  const available: PaymentMethodDefinition[] = [];
  const seen = new Set<string>();

  const pushDef = (def: PaymentMethodDefinition | null | undefined) => {
    if (!def || seen.has(def.id)) return;
    if (!isPaymentMethodAvailable(instructions, def.id)) return;
    seen.add(def.id);
    available.push(def);
  };

  // eCitizen-style rails: instant gateway first, then manual paste options.
  if (options?.includeStk !== false) {
    pushDef(getPaymentMethodDefinition("mpesa-stk"));
  }
  pushDef(getPaymentMethodDefinition("manual-mpesa"));
  pushDef(getPaymentMethodDefinition("manual-bank"));

  for (const id of enabled) {
    // Prefer the explicit manual rails over the legacy "mpesa" card when both exist.
    if (id === "mpesa" && seen.has("manual-mpesa")) continue;
    if (!isPaymentMethodAvailable(instructions, id)) continue;
    const def = getPaymentMethodDefinition(id);
    if (def) {
      pushDef(def);
      continue;
    }
    // Synthetic / legacy ids
    if (id === "kcb-transfer") {
      pushDef({
        id,
        name: "KCB Bank Transfer",
        type: "bank",
        settlement: "manual",
        description: "Transfer to the organization's KCB account",
        accent: "from-green-700 to-green-900",
        logoText: "KCB",
      });
    } else if (id === "bank-other") {
      pushDef({
        id,
        name: instructions.bankName || "Bank transfer",
        type: "bank",
        settlement: "manual",
        description: "Bank transfer to the organization account",
        accent: "from-slate-600 to-slate-900",
        logoText: "BANK",
      });
    }
  }

  // Drop STK when Daraja env is not configured (checked at list time by caller optionally).
  // Stable catalog order
  const order = new Map(
    PAYMENT_METHOD_CATALOG.map((item, index) => [item.id, index]),
  );
  available.sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
  );
  return available;
}

export function parsePaymentInstructions(
  customFields: Prisma.JsonValue | null | undefined,
): PaymentInstructions {
  const fields = asObject(customFields);
  const payment = asObject(fields.paymentInstructions);

  const bankAccounts = parseBankAccounts(payment.bankAccounts);
  const enabledMethods = parseStringArray(payment.enabledMethods);

  // Hydrate legacy single bank into bankAccounts when possible
  const bankEnabled = getBoolean(payment, "bankEnabled");
  const bankName = getString(payment, "bankName");
  const bankAccountName = getString(payment, "bankAccountName");
  const bankAccountNumber = getString(payment, "bankAccountNumber");
  const bankBranch = getString(payment, "bankBranch");
  const bankInstructions = getString(payment, "bankInstructions");

  if (bankEnabled && bankAccountNumber && Object.keys(bankAccounts).length === 0) {
    const matched = matchBankNameToMethodId(bankName) ?? "bank-other";
    const key = matched === "kcb-transfer" ? "kcb-transfer" : matched;
    bankAccounts[key] = {
      accountName: bankAccountName,
      accountNumber: bankAccountNumber,
      branch: bankBranch,
      instructions: bankInstructions,
      businessName: bankName,
    };
  }

  const methodNotes = parseMethodNotes(payment.methodNotes);

  return {
    enabledMethods,
    mpesaEnabled: getBoolean(payment, "mpesaEnabled"),
    mpesaBusinessName: getString(payment, "mpesaBusinessName"),
    mpesaPaybill: getString(payment, "mpesaPaybill"),
    mpesaTillNumber: getString(payment, "mpesaTillNumber"),
    mpesaAccountNumber: getString(payment, "mpesaAccountNumber"),
    mpesaInstructions: getString(payment, "mpesaInstructions"),
    kcbPaybillEnabled: getBoolean(payment, "kcbPaybillEnabled"),
    kcbBusinessName: getString(payment, "kcbBusinessName"),
    kcbPaybill: getString(payment, "kcbPaybill"),
    kcbAccountNumber: getString(payment, "kcbAccountNumber"),
    kcbAccountName: getString(payment, "kcbAccountName"),
    kcbInstructions: getString(payment, "kcbInstructions"),
    bankAccounts,
    bankEnabled,
    bankName,
    bankAccountName,
    bankAccountNumber,
    bankBranch,
    bankInstructions,
    methodNotes,
    airtelBusinessName:
      getString(payment, "airtelBusinessName") ||
      methodNotes["airtel-money.name"] ||
      "",
    airtelNumber:
      getString(payment, "airtelNumber") ||
      methodNotes["airtel-money.number"] ||
      "",
    airtelInstructions:
      getString(payment, "airtelInstructions") ||
      methodNotes["airtel-money"] ||
      "",
  };
}

export function mergePaymentInstructions(
  customFields: Prisma.JsonValue | null | undefined,
  paymentInstructions: PaymentInstructions,
) {
  return {
    ...asObject(customFields),
    paymentInstructions,
  };
}

export function hasAnyPaymentInstructions(instructions: PaymentInstructions) {
  return listAvailablePaymentMethods(instructions).length > 0;
}

/** @deprecated Use isPaymentMethodAvailable(instructions, "kcb") */
export function isKcbPaybillAvailable(instructions: PaymentInstructions) {
  return isPaymentMethodAvailable(instructions, "kcb");
}
