import { generatePreviousReceiptPdf } from "./receipt-pdf-v1";
import { generateReceiptPdfV2 } from "./receipt-pdf-v2";
import { generateReceiptPdfV3 } from "./receipt-pdf-v3";

export type ReceiptPdfData = {
  pdfTemplateVersion?: 1 | 2 | 3;
  serialNumber: string;
  verificationUrl: string;
  status: string;
  issuedAt: Date;
  organizationName: string;
  organizationAddress?: string | null;
  payerName: string;
  amount: number;
  currencyCode: string;
  paymentMethod: string;
  paymentFor: string;
  paymentReference?: string | null;
  paidAt: Date;
  organizationPhone?: string | null;
  organizationEmail?: string | null;
  kraPin?: string | null;
  /** Tenant / buyer KRA PIN for eTIMS-shaped receipts */
  tenantKraPin?: string | null;
  /** Control unit serial when org has eTIMS device registered */
  etimsControlUnitSerial?: string | null;
  /** Footer line from buildEtimsReadyReceiptFields */
  etimsFooter?: string | null;
  tenantIdentifier?: string | null;
  propertyName?: string | null;
  unitName?: string | null;
  leaseIdentifier?: string | null;
  periods?: string[];
  allocations?: Array<{ period: string; description: string; amount: number }>;
  previousBalance?: number | null;
  remainingBalance?: number | null;
  creditCarriedForward?: number;
  verifiedBy?: string | null;
};

export async function generateReceiptPdf(data: ReceiptPdfData) {
  if (data.pdfTemplateVersion === 1) return generatePreviousReceiptPdf(data);
  if (data.pdfTemplateVersion === 2) return generateReceiptPdfV2({ ...data, pdfTemplateVersion: 2 });
  return generateReceiptPdfV3(data);
}
