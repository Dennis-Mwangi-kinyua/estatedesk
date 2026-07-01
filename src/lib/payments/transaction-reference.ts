export function normalizeTransactionReference(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeProviderPart(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildMpesaTransactionKey(reference: string) {
  const normalized = normalizeTransactionReference(reference);
  return normalized ? `MPESA:${normalized}` : "";
}

export function buildBankTransactionKey({
  bankName,
  accountNumber,
  reference,
}: {
  bankName: string;
  accountNumber: string;
  reference: string;
}) {
  const bank = normalizeProviderPart(bankName) || "BANK";
  const account = normalizeProviderPart(accountNumber) || "ACCOUNT";
  const normalized = normalizeTransactionReference(reference);
  return normalized ? `BANK:${bank}:${account}:${normalized}` : "";
}

export function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
