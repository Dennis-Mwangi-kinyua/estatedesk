import { generatePreviousReceiptPdf } from "./receipt-pdf-v1";
import { createProfessionalPdf } from "./professional-pdf";

export type ReceiptPdfData = {
  pdfTemplateVersion?: 1 | 2;
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

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function label(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const SMALL_NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function integerWords(value: number): string {
  if (value < 20) return SMALL_NUMBER_WORDS[value];
  if (value < 100) return `${TENS_WORDS[Math.floor(value / 10)]}${value % 10 ? `-${SMALL_NUMBER_WORDS[value % 10]}` : ""}`;
  if (value < 1_000) return `${SMALL_NUMBER_WORDS[Math.floor(value / 100)]} hundred${value % 100 ? ` ${integerWords(value % 100)}` : ""}`;
  for (const [size, name] of [[1_000_000_000, "billion"], [1_000_000, "million"], [1_000, "thousand"]] as const) {
    if (value >= size) return `${integerWords(Math.floor(value / size))} ${name}${value % size ? ` ${integerWords(value % size)}` : ""}`;
  }
  return String(value);
}

function amountInWords(amount: number, currencyCode: string) {
  const totalCents = Math.round(Math.abs(amount) * 100);
  const whole = Math.floor(totalCents / 100);
  const cents = totalCents % 100;
  return `${currencyCode} ${integerWords(whole)}${cents ? ` and ${integerWords(cents)} cents` : " only"}`;
}

export async function generateReceiptPdfV2(data: ReceiptPdfData) {
  if (data.pdfTemplateVersion === 1) return generatePreviousReceiptPdf(data);
  // Keep the original version-two accent values so registered PDF hashes remain valid.
  const doc = await createProfessionalPdf({ ...data, title: "Payment receipt", accentRgb: [.04, .39, .32] });
  doc.paragraph(data.organizationName, { size: 18, strong: true });
  doc.paragraph([data.organizationAddress, data.organizationPhone, data.organizationEmail].filter(Boolean).join(" | ") || "Issuer contact details not supplied", { size: 9 });
  doc.section("Amount received");
  doc.paragraph(formatMoney(data.amount, data.currencyCode), { size: 24, strong: true, accent: true });
  doc.paragraph(amountInWords(data.amount, data.currencyCode), { size: 9 });
  doc.paragraph(`Status: ${label(data.status)} | Paid: ${formatDate(data.paidAt)} | Issued: ${formatDate(data.issuedAt)}`, { size: 8 });
  doc.section("Received from");
  doc.details([["Payer", data.payerName], ...(data.tenantIdentifier ? [["Tenant reference", data.tenantIdentifier] as [string, string]] : []), ["Property / unit", [data.propertyName, data.unitName].filter(Boolean).join(" / ") || "Not linked"], ...(data.leaseIdentifier ? [["Lease reference", data.leaseIdentifier] as [string, string]] : []), ...(data.tenantKraPin ? [["Buyer KRA PIN", data.tenantKraPin] as [string, string]] : [])]);
  doc.section("Payment details");
  doc.details([["Payment for", label(data.paymentFor)], ["Payment method", label(data.paymentMethod)], ["Transaction reference", data.paymentReference], ["Verified by", data.verifiedBy || "EstateDesk authorized staff"]]);
  doc.section("Payment allocation");
  const allocations = data.allocations?.length ? data.allocations : [{ period: data.periods?.[0] ?? "Not specified", description: label(data.paymentFor), amount: data.amount }];
  doc.table([{ label: "Period", width: 85 }, { label: "Description", width: 280 }, { label: `Amount (${data.currencyCode})`, width: 150.28, right: true }], allocations.map(item => [item.period, item.description, formatMoney(item.amount, data.currencyCode)]));
  doc.section("Account summary");
  doc.details([["Previous balance", data.previousBalance == null ? "Not applicable" : formatMoney(data.previousBalance, data.currencyCode)], ["Remaining balance", data.remainingBalance == null ? "Not applicable" : formatMoney(data.remainingBalance, data.currencyCode)], ["Credit carried forward", formatMoney(data.creditCarriedForward ?? 0, data.currencyCode)]]);
  if (data.kraPin || data.etimsControlUnitSerial || data.etimsFooter) {
    doc.section("Tax information");
    doc.details([["Seller KRA PIN", data.kraPin], ["Control unit serial", data.etimsControlUnitSerial || "Not supplied"]]);
    if (data.etimsFooter) doc.paragraph(data.etimsFooter, { size: 8 });
  }
  await doc.verification("Scan the QR code to verify the issuer, payer, amount, payment reference and current receipt status. Confirm material payments against the source provider statement.");
  return doc.save();
}
