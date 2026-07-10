import type { Prisma } from "@prisma/client";
import type { InvoicePdfData } from "@/lib/documents/invoice-pdf";

export type InvoiceSnapshot = Omit<
  InvoicePdfData,
  "issuedAt" | "dueDate" | "confirmedAt"
> & {
  issuedAt: string;
  dueDate: string;
  confirmedAt?: string | null;
};

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function createInvoiceSnapshot(data: InvoicePdfData): InvoiceSnapshot {
  return {
    ...data,
    issuedAt: data.issuedAt.toISOString(),
    dueDate: data.dueDate.toISOString(),
    confirmedAt: toIsoDate(data.confirmedAt),
  };
}

export function readInvoiceSnapshot(
  metadata: Prisma.JsonValue | null | undefined,
): InvoicePdfData | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const snapshot = (metadata as Record<string, Prisma.JsonValue>).invoiceSnapshot;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  const raw = snapshot as InvoiceSnapshot;

  if (
    typeof raw.serialNumber !== "string" ||
    typeof raw.verificationCode !== "string" ||
    typeof raw.verificationUrl !== "string" ||
    typeof raw.period !== "string" ||
    typeof raw.issuedAt !== "string" ||
    typeof raw.dueDate !== "string"
  ) {
    return null;
  }

  return {
    ...raw,
    issuedAt: new Date(raw.issuedAt),
    dueDate: new Date(raw.dueDate),
    confirmedAt: raw.confirmedAt ? new Date(raw.confirmedAt) : null,
  };
}