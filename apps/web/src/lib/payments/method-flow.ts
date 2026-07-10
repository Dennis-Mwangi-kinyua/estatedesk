import {
  getPaymentMethodDefinition,
  type PaymentSettlementMode,
} from "./methods-catalog";
import {
  buildBankTransactionKey,
  buildMpesaTransactionKey,
  normalizeTransactionReference,
} from "./transaction-reference";
import type { PaymentInstructions } from "./instructions";
import { getBankAccountForMethod } from "./instructions";

export type CheckoutMethodKind =
  | "mpesa_stk"
  | "mpesa"
  | "airtel"
  | "kcb_paybill"
  | "bank"
  | "manual_mpesa"
  | "manual_bank"
  | "unknown";

export function classifyCheckoutMethod(method: string): CheckoutMethodKind {
  if (method === "mpesa-stk") return "mpesa_stk";
  if (method === "manual-mpesa") return "manual_mpesa";
  if (method === "manual-bank") return "manual_bank";
  if (method === "mpesa") return "mpesa";
  if (method === "airtel-money") return "airtel";
  if (method === "kcb") return "kcb_paybill";
  if (
    method === "kcb-transfer" ||
    method === "bank-other" ||
    getPaymentMethodDefinition(method)?.type === "bank"
  ) {
    if (method === "kcb") return "kcb_paybill";
    return "bank";
  }
  return "unknown";
}

/** Gateway methods auto-settle the bill when the provider confirms success. */
export function isGatewayCheckoutMethod(method: string) {
  const def = getPaymentMethodDefinition(method);
  if (def?.settlement === "gateway") return true;
  return classifyCheckoutMethod(method) === "mpesa_stk";
}

export function getCheckoutSettlementMode(
  method: string,
): PaymentSettlementMode {
  return isGatewayCheckoutMethod(method) ? "gateway" : "manual";
}

export function isMobileMoneyCheckoutMethod(method: string) {
  const kind = classifyCheckoutMethod(method);
  return (
    kind === "mpesa" ||
    kind === "mpesa_stk" ||
    kind === "manual_mpesa" ||
    kind === "airtel" ||
    kind === "kcb_paybill"
  );
}

export function isBankCheckoutMethod(method: string) {
  const kind = classifyCheckoutMethod(method);
  return kind === "bank" || kind === "manual_bank";
}

export function requiresPhoneForCheckout(method: string) {
  return isMobileMoneyCheckoutMethod(method);
}

export function requiresAccountNameForCheckout(method: string) {
  return isBankCheckoutMethod(method) && method !== "kcb";
}

/** STK does not need a pre-paste code — Daraja returns the receipt. */
export function requiresTransactionIdForCheckout(method: string) {
  if (isGatewayCheckoutMethod(method)) return false;
  const kind = classifyCheckoutMethod(method);
  return (
    kind === "mpesa" ||
    kind === "manual_mpesa" ||
    kind === "airtel" ||
    kind === "kcb_paybill" ||
    kind === "bank" ||
    kind === "manual_bank"
  );
}

/** Map checkout method id → Prisma PaymentMethod enum value. */
export function mapCheckoutMethodToPaymentMethod(method: string) {
  if (method === "cash") return "CASH" as const;
  if (method === "mpesa-stk") return "MPESA_STK" as const;
  const kind = classifyCheckoutMethod(method);
  if (
    kind === "mpesa" ||
    kind === "manual_mpesa" ||
    kind === "airtel" ||
    kind === "kcb_paybill"
  ) {
    return "MPESA_MANUAL" as const;
  }
  if (kind === "bank" || kind === "manual_bank") return "BANK" as const;
  return "BANK" as const;
}

export function checkoutMethodLabel(method: string) {
  return getPaymentMethodDefinition(method)?.name ?? method;
}

export function isMpesaStkConfigured() {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY?.trim() &&
      process.env.MPESA_CONSUMER_SECRET?.trim() &&
      process.env.MPESA_SHORTCODE?.trim() &&
      process.env.MPESA_PASSKEY?.trim() &&
      process.env.MPESA_CALLBACK_URL?.trim(),
  );
}

export function validateCheckoutTransactionId(
  method: string,
  rawTransactionId: string,
): { ok: true; transactionId: string } | { ok: false; error: string } {
  const transactionId = normalizeTransactionReference(rawTransactionId);
  const kind = classifyCheckoutMethod(method);

  if (!transactionId) {
    return {
      ok: false,
      error: "Enter the payment confirmation / transaction code.",
    };
  }

  if (kind === "mpesa" || kind === "manual_mpesa" || kind === "kcb_paybill") {
    if (!/^[A-Z0-9]{10}$/.test(transactionId)) {
      return {
        ok: false,
        error: "Enter the 10-character M-Pesa transaction code (e.g. QAB12CD34E).",
      };
    }
    return { ok: true, transactionId };
  }

  if (kind === "airtel") {
    // Airtel codes vary; accept 8–20 alphanumeric
    if (!/^[A-Z0-9]{8,20}$/.test(transactionId)) {
      return {
        ok: false,
        error: "Enter a valid Airtel Money transaction reference (8–20 characters).",
      };
    }
    return { ok: true, transactionId };
  }

  if (kind === "bank" || kind === "manual_bank") {
    if (transactionId.length < 4 || transactionId.length > 100) {
      return {
        ok: false,
        error: "Enter a valid bank transaction / transfer reference.",
      };
    }
    return { ok: true, transactionId };
  }

  return { ok: false, error: "Unsupported payment method." };
}

export function buildCheckoutTransactionKey(input: {
  method: string;
  transactionId: string;
  instructions: PaymentInstructions;
}): string | null {
  const { method, transactionId, instructions } = input;
  const kind = classifyCheckoutMethod(method);

  if (kind === "mpesa" || kind === "manual_mpesa") {
    return buildMpesaTransactionKey(transactionId);
  }

  if (kind === "airtel") {
    return buildBankTransactionKey({
      bankName: "AIRTEL",
      accountNumber: instructions.airtelNumber || "AIRTEL",
      reference: transactionId,
    });
  }

  if (kind === "kcb_paybill") {
    return buildBankTransactionKey({
      bankName: "KCB",
      accountNumber: instructions.kcbAccountNumber || instructions.kcbPaybill,
      reference: transactionId,
    });
  }

  if (kind === "bank" || kind === "manual_bank") {
    const account =
      getBankAccountForMethod(instructions, method) ||
      // manual-bank: use any configured bank account
      Object.values(instructions.bankAccounts).find(
        (item) => item.accountNumber.trim(),
      ) ||
      (instructions.bankAccountNumber.trim()
        ? {
            accountName: instructions.bankAccountName,
            accountNumber: instructions.bankAccountNumber,
            branch: instructions.bankBranch,
            instructions: instructions.bankInstructions,
            businessName: instructions.bankName,
          }
        : null);
    if (!account) {
      // Still key by reference so duplicates are blocked
      return buildBankTransactionKey({
        bankName: "BANK",
        accountNumber: "MANUAL",
        reference: transactionId,
      });
    }
    return buildBankTransactionKey({
      bankName: method || account.businessName || instructions.bankName,
      accountNumber: account.accountNumber,
      reference: transactionId,
    });
  }

  return null;
}

export function submissionNotesForMethod(method: string) {
  const label = checkoutMethodLabel(method);
  if (isGatewayCheckoutMethod(method)) {
    return `Tenant started ${label} gateway payment.`;
  }
  return `Tenant submitted ${label} payment awaiting organization verification.`;
}

export function channelForMethod(method: string) {
  const kind = classifyCheckoutMethod(method);
  if (kind === "mpesa_stk") return "mpesa_stk";
  if (kind === "kcb_paybill") return "kcb_paybill";
  if (kind === "mpesa" || kind === "manual_mpesa") return "mpesa_manual";
  if (kind === "airtel") return "airtel_money";
  if (kind === "bank" || kind === "manual_bank") return `bank_${method}`;
  return method;
}
