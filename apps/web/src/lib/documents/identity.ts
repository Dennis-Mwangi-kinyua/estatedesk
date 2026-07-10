import crypto from "node:crypto";

const SERIAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const TYPE_PREFIXES = {
  RECEIPT: "RCT",
  LEASE: "LSE",
  INVOICE: "INV",
  NOTICE: "NTC",
  INSPECTION_REPORT: "INSP",
  OWNER_STATEMENT: "OWN",
  RECONCILIATION_REPORT: "REC",
  DATA_EXPORT: "EXP",
  OTHER: "DOC",
} as const;

export type DocumentIdentityType = keyof typeof TYPE_PREFIXES;

function encodeSerialEntropy(bytes: Uint8Array) {
  return Array.from(bytes, (value) => SERIAL_ALPHABET[value % SERIAL_ALPHABET.length]).join("");
}

export function createDocumentIdentity(
  documentType: DocumentIdentityType,
  issuedAt = new Date(),
  entropy: Uint8Array = crypto.randomBytes(10),
) {
  const year = issuedAt.getUTCFullYear();
  const serialEntropy = encodeSerialEntropy(entropy.subarray(0, 10));

  return {
    serialNumber: `ED-${TYPE_PREFIXES[documentType]}-${year}-${serialEntropy}`,
    verificationCode: crypto.randomBytes(24).toString("base64url"),
  };
}

export function hashDocumentContent(content: Uint8Array) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function documentVerificationPath(verificationCode: string) {
  return `/verify-document/${encodeURIComponent(verificationCode)}`;
}
