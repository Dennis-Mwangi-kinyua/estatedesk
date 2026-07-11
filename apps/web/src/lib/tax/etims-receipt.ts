/**
 * eTIMS / eRITS–ready receipt field helpers.
 *
 * Does not call KRA live APIs. Produces structured fields and CU-style
 * placeholders so receipts and exports match submission-ready layouts once
 * credentials and device integration are enabled.
 */

export type EtimsReceiptFields = {
  /** Organization KRA PIN when known */
  sellerPin: string | null;
  buyerPin: string | null;
  invoiceNumber: string;
  controlUnitSerial: string | null;
  internalData: string | null;
  receiptSignature: string | null;
  receiptType: "SALES" | "CREDIT_NOTE" | "PROFORMA";
  taxEnvironment: "sandbox" | "production" | "unconfigured";
  /** ISO date for CU timestamp slot */
  cuTimestamp: string;
  itemLines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  }>;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  currencyCode: string;
  readyForSubmission: boolean;
  readinessNotes: string[];
};

export type BuildEtimsReceiptInput = {
  serialNumber: string;
  organizationKraPin?: string | null;
  tenantKraPin?: string | null;
  amount: number;
  currencyCode?: string;
  paymentFor?: string;
  allocations?: Array<{ period: string; description: string; amount: number }>;
  /** Optional pre-registered CU serial from org tax settings */
  controlUnitSerial?: string | null;
  issuedAt?: Date;
};

function taxEnvironment(): EtimsReceiptFields["taxEnvironment"] {
  const env = process.env.KRA_ETIMS_ENVIRONMENT?.trim().toLowerCase();
  if (env === "production" || env === "prod") return "production";
  if (env === "sandbox" || env === "test") return "sandbox";
  if (
    process.env.KRA_ETIMS_CLIENT_ID?.trim() &&
    process.env.KRA_ETIMS_CLIENT_SECRET?.trim()
  ) {
    return "sandbox";
  }
  return "unconfigured";
}

/**
 * Residential rent is typically VAT-exempt in Kenya; service lines may vary.
 * Default zero-rated layout keeps receipts eTIMS-shaped without inventing tax.
 */
export function buildEtimsReadyReceiptFields(
  input: BuildEtimsReceiptInput,
): EtimsReceiptFields {
  const currencyCode = input.currencyCode || "KES";
  const issuedAt = input.issuedAt ?? new Date();
  const cuTimestamp = issuedAt.toISOString();

  const lines =
    input.allocations && input.allocations.length > 0
      ? input.allocations.map((line) => ({
          description: `${line.description} (${line.period})`,
          quantity: 1,
          unitPrice: line.amount,
          taxRate: 0,
          taxAmount: 0,
          total: line.amount,
        }))
      : [
          {
            description: input.paymentFor || "Property charges",
            quantity: 1,
            unitPrice: input.amount,
            taxRate: 0,
            taxAmount: 0,
            total: input.amount,
          },
        ];

  const taxableAmount = lines.reduce((s, l) => s + l.total, 0);
  const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0);
  const totalAmount = taxableAmount + taxAmount;

  const notes: string[] = [];
  const env = taxEnvironment();
  if (env === "unconfigured") {
    notes.push("KRA eTIMS credentials not configured — fields are layout-ready only.");
  }
  if (!input.organizationKraPin?.trim()) {
    notes.push("Seller KRA PIN missing on organization profile.");
  }
  if (!input.controlUnitSerial?.trim()) {
    notes.push("Control unit serial not registered — placeholder used.");
  }

  const readyForSubmission =
    env !== "unconfigured" &&
    Boolean(input.organizationKraPin?.trim()) &&
    Boolean(input.controlUnitSerial?.trim()) &&
    totalAmount > 0;

  return {
    sellerPin: input.organizationKraPin?.trim() || null,
    buyerPin: input.tenantKraPin?.trim() || null,
    invoiceNumber: input.serialNumber,
    controlUnitSerial: input.controlUnitSerial?.trim() || null,
    internalData: null,
    receiptSignature: null,
    receiptType: "SALES",
    taxEnvironment: env,
    cuTimestamp,
    itemLines: lines,
    taxableAmount,
    taxAmount,
    totalAmount,
    currencyCode,
    readyForSubmission,
    readinessNotes: notes,
  };
}

export function formatEtimsFooterSummary(fields: EtimsReceiptFields): string {
  const pin = fields.sellerPin ? `Seller PIN: ${fields.sellerPin}` : "Seller PIN: —";
  const cu = fields.controlUnitSerial
    ? `CU: ${fields.controlUnitSerial}`
    : "CU: pending registration";
  const status = fields.readyForSubmission
    ? "eTIMS submission-ready"
    : "eTIMS layout-ready (not submitted)";
  return `${pin} · ${cu} · ${status}`;
}
