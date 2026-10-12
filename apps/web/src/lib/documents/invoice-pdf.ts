import { createProfessionalPdf } from "./professional-pdf";

export type InvoicePdfWaterReading = {
  prevReading: number;
  currentReading: number;
  unitsUsed: number;
  ratePerUnit: number;
  fixedCharge: number;
  billStatus: string;
  readingStatus: string;
  submittedByName?: string | null;
  confirmedByName?: string | null;
};

export type InvoicePdfPreviousBill = {
  period: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  rentTotal: number | null;
  waterTotal: number | null;
  status: string;
};

export type InvoicePdfLine = {
  label: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  waterReading?: InvoicePdfWaterReading;
};

export type InvoicePdfData = {
  serialNumber: string;
  verificationCode: string;
  verificationUrl: string;
  status: string;
  issuedAt: Date;
  dueDate: Date;
  period: string;
  organizationName: string;
  organizationAddress?: string | null;
  organizationPhone?: string | null;
  organizationEmail?: string | null;
  tenantName: string;
  tenantIdentifier?: string | null;
  propertyName: string;
  unitName: string;
  buildingName?: string | null;
  currencyCode: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  lines: InvoicePdfLine[];
  submittedByName?: string | null;
  confirmedByName?: string | null;
  confirmedAt?: Date | null;
  previousBill?: InvoicePdfPreviousBill | null;
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
    timeZone: "Africa/Nairobi",
  }).format(value);
}

function formatDateTime(value: Date) {
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

export async function generateInvoicePdf(data: InvoicePdfData) {
  const doc = await createProfessionalPdf({ ...data, title: "Invoice" });
  doc.paragraph(data.organizationName, { size: 18, strong: true });
  doc.paragraph([data.organizationAddress, data.organizationPhone, data.organizationEmail].filter(Boolean).join(" | ") || "Issuer contact details not supplied");
  doc.section("Invoice summary");
  doc.paragraph(`Balance due: ${formatMoney(data.balance, data.currencyCode)}`, { size: 22, strong: true, accent: true });
  doc.paragraph(`Status: ${data.status.replaceAll("_", " ")} | Billing period: ${data.period}`, { size: 9 });
  doc.details([["Issue date", formatDateTime(data.issuedAt)], ["Due date", formatDate(data.dueDate)], ["Verification code", data.verificationCode]]);
  doc.section("Bill to");
  doc.details([["Tenant", data.tenantName], ...(data.tenantIdentifier ? [["Tenant reference", data.tenantIdentifier] as [string, string]] : []), ["Property / unit", [data.propertyName, data.buildingName, data.unitName].filter(Boolean).join(" / ")]]);
  doc.section("Itemised charges");
  doc.table([{ label: "Description", width: 215.28 }, { label: "Amount", width: 100, right: true }, { label: "Paid", width: 100, right: true }, { label: "Balance", width: 100, right: true }], data.lines.map(item => [item.label, formatMoney(item.amountDue, data.currencyCode), formatMoney(item.amountPaid, data.currencyCode), formatMoney(item.balance, data.currencyCode)]));
  doc.details([["Total billed", formatMoney(data.amountDue, data.currencyCode)], ["Amount paid", formatMoney(data.amountPaid, data.currencyCode)], ["Balance due", formatMoney(data.balance, data.currencyCode)]]);
  if (data.previousBill) {
    const bill = data.previousBill;
    doc.section(`Previous billing period: ${bill.period}`);
    doc.details([["Total billed", formatMoney(bill.amountDue, data.currencyCode)], ["Amount paid", formatMoney(bill.amountPaid, data.currencyCode)], ["Previous balance", formatMoney(bill.balance, data.currencyCode)], ["Rent", bill.rentTotal == null ? "Not applicable" : formatMoney(bill.rentTotal, data.currencyCode)], ["Water", bill.waterTotal == null ? "Not applicable" : formatMoney(bill.waterTotal, data.currencyCode)], ["Status", bill.status]]);
  }
  for (const line of data.lines.filter(item => item.waterReading)) {
    const reading = line.waterReading!;
    doc.section(`Water meter details: ${line.label}`);
    doc.details([["Previous reading", String(reading.prevReading)], ["Current reading", String(reading.currentReading)], ["Units consumed", String(reading.unitsUsed)], ["Rate per unit", formatMoney(reading.ratePerUnit, data.currencyCode)], ["Fixed charge", formatMoney(reading.fixedCharge, data.currencyCode)], ["Reading status", reading.readingStatus], ["Bill status", reading.billStatus], ["Submitted by", reading.submittedByName], ["Confirmed by", reading.confirmedByName || "Awaiting confirmation"]]);
  }
  doc.section("Billing record");
  doc.details([...(data.submittedByName ? [["Submitted by", data.submittedByName] as [string, string]] : []), ["Confirmed by", data.confirmedByName || "Awaiting confirmation"], ...(data.confirmedAt ? [["Confirmed at", formatDateTime(data.confirmedAt)] as [string, string]] : [])]);
  doc.paragraph("This invoice lists charges and outstanding balances. It is not proof of payment. Retain your verified payment receipt for payments made.", { size: 9 });
  await doc.verification("Scan the QR code to check this invoice's issuer, tenant, billing period, amounts and current document status.");
  return doc.save();
}
