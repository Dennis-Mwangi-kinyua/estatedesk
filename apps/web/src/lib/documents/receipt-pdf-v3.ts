import { amountInWords } from "./receipt-amount-words";
import type { ReceiptPdfData } from "./receipt-pdf";
import { createReceiptLayout } from "./receipt-layout";

const label = (value: string) => value.toLowerCase().split("_").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const date = (value: Date) => new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Nairobi" }).format(value);
function period(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-KE", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`));
}

/** Version three deliberately presents public receipt references, never tenant/lease database keys. */
export async function generateReceiptPdfV3(data: ReceiptPdfData) {
  const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: data.currencyCode, minimumFractionDigits: 2 }).format(value);
  const doc = await createReceiptLayout({ ...data, title: "Payment receipt" });
  doc.paragraph(data.organizationName, { size: 18, strong: true });
  const contacts = [data.organizationAddress, data.organizationPhone, data.organizationEmail].filter(Boolean).join(" | ");
  if (contacts) doc.paragraph(contacts, { size: 9 });
  doc.hero(money(data.amount), amountInWords(data.amount, data.currencyCode), `${label(data.status)} | Paid ${date(data.paidAt)}`);
  doc.cards(
    [["Received from", data.payerName], ["Property", data.propertyName || "Not linked"], ["Unit", data.unitName || "Not linked"]],
    [["Payment for", label(data.paymentFor)], ["Payment method", data.paymentMethod === "MPESA" ? "M-Pesa" : label(data.paymentMethod)], ["Transaction reference", data.paymentReference || "Not supplied"]],
  );
  doc.section("Payment allocation");
  const allocations = data.allocations?.length ? data.allocations : [{ period: data.periods?.[0] ?? "Not specified", description: label(data.paymentFor), amount: data.amount }];
  doc.table([{ label: "Period", width: 85 }, { label: "Description", width: 280 }, { label: `Amount (${data.currencyCode})`, width: 150.28, right: true }], allocations.map(item => [period(item.period), item.description, money(item.amount)]));
  doc.section("Account summary");
  doc.cards(
    [["Previous balance", data.previousBalance == null ? "Not applicable" : money(data.previousBalance)], ["Remaining balance", data.remainingBalance == null ? "Not applicable" : money(data.remainingBalance)]],
    [["Credit carried forward", money(data.creditCarriedForward ?? 0)], ["Issued on", date(data.issuedAt)]],
  );
  if (data.verifiedBy) doc.paragraph(`Verified by: ${data.verifiedBy}`, { size: 8 });
  if (data.kraPin || data.tenantKraPin || data.etimsControlUnitSerial || data.etimsFooter) {
    doc.section("Tax information");
    doc.cards([["Seller KRA PIN", data.kraPin], ["Buyer KRA PIN", data.tenantKraPin]], [["Control unit serial", data.etimsControlUnitSerial]]);
    if (data.etimsFooter) doc.paragraph(data.etimsFooter, { size: 8 });
  }
  await doc.verification("Scan to confirm this receipt's authenticity and current status. Retain this receipt for your records. For payment queries, contact the issuing organisation.");
  return doc.save();
}
