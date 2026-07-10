import { Prisma } from "@prisma/client";

export type PaymentInstructions = {
  mpesaEnabled: boolean;
  mpesaBusinessName: string;
  mpesaPaybill: string;
  mpesaTillNumber: string;
  mpesaAccountNumber: string;
  mpesaInstructions: string;
  bankEnabled: boolean;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankInstructions: string;
};

export const emptyPaymentInstructions: PaymentInstructions = {
  mpesaEnabled: false,
  mpesaBusinessName: "",
  mpesaPaybill: "",
  mpesaTillNumber: "",
  mpesaAccountNumber: "",
  mpesaInstructions: "",
  bankEnabled: false,
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankBranch: "",
  bankInstructions: "",
};

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

export function parsePaymentInstructions(
  customFields: Prisma.JsonValue | null | undefined,
): PaymentInstructions {
  const fields = asObject(customFields);
  const payment = asObject(fields.paymentInstructions);

  return {
    mpesaEnabled: getBoolean(payment, "mpesaEnabled"),
    mpesaBusinessName: getString(payment, "mpesaBusinessName"),
    mpesaPaybill: getString(payment, "mpesaPaybill"),
    mpesaTillNumber: getString(payment, "mpesaTillNumber"),
    mpesaAccountNumber: getString(payment, "mpesaAccountNumber"),
    mpesaInstructions: getString(payment, "mpesaInstructions"),
    bankEnabled: getBoolean(payment, "bankEnabled"),
    bankName: getString(payment, "bankName"),
    bankAccountName: getString(payment, "bankAccountName"),
    bankAccountNumber: getString(payment, "bankAccountNumber"),
    bankBranch: getString(payment, "bankBranch"),
    bankInstructions: getString(payment, "bankInstructions"),
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
