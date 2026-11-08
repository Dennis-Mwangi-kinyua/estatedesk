import { invoiceBalance, subscriptionInvoiceStatus, type SubscriptionInvoiceData } from "./invoice-ledger";
import { APP_PLANS } from "./plans";
import { createProfessionalPdf } from "../documents/professional-pdf";

export const DEFAULT_SUBSCRIPTION_PAYMENT_INSTRUCTIONS = "Family Bank - Lipa na M-Pesa\nPaybill (business number): 222111\nAccount number: 150160";

export function subscriptionInvoiceAmount(plan: keyof typeof APP_PLANS, metadata: unknown) {
  const custom = metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as { amountDue?: unknown }).amountDue : undefined;
  const amount = typeof custom === "number" && custom !== 0 ? custom : APP_PLANS[plan].monthlyAmount;
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Set a subscription amount before sending an invoice for this plan.");
  return amount;
}

export function renewedSubscriptionPeriod(currentEnd: Date, now: Date) {
  const start = currentEnd > now ? currentEnd : now;
  return { currentPeriodStart: start, currentPeriodEnd: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000) };
}

export async function createSubscriptionInvoice(input: {
  reference: string; organisation: string; plan: string; amount: number;
  issuedAt: Date; renewalDate: Date; paymentInstructions: string; ledger?: SubscriptionInvoiceData;
}) {
  if (!input.paymentInstructions.trim()) throw new Error("Configure EstateDesk subscription payment instructions before sending an invoice.");
  const document = await createProfessionalPdf({ title: "Subscription invoice", serialNumber: input.reference, organizationName: "EstateDesk", issuedAt: input.issuedAt, footerText: "EstateDesk | Subscription invoice - not a payment receipt." });
  document.paragraph("EstateDesk", { strong: true, size: 18 });
  document.section("Bill to");
  document.details([["Organisation", input.organisation], ["Invoice reference", input.reference], ["Issued", input.issuedAt.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })], ["Renewal date", input.renewalDate.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })]]);
  document.section("Subscription");
  document.details([["Plan", input.plan], ["Renewal duration", "30 days"], ["Total payable", `KES ${input.amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]]);
  if (input.ledger) {
    const data = input.ledger;
    document.section("Payment status");
    document.details([["Status", subscriptionInvoiceStatus(data)], ["Paid", `KES ${((data.amountMinor - invoiceBalance(data)) / 100).toFixed(2)}`], ["Outstanding", `KES ${(invoiceBalance(data) / 100).toFixed(2)}`], ["Subscription extended until", data.renewedUntil ? new Date(data.renewedUntil).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" }) : "Awaiting full payment"]]);
    for (const payment of data.payments) document.paragraph(`Payment ${payment.reference}: KES ${(payment.amountMinor / 100).toFixed(2)} | Receipt ${payment.receiptNumber ?? "Available in billing history"}`);
  }
  document.section("Payment instructions");
  document.paragraph(input.paymentInstructions);
  document.paragraph(`Quote invoice reference ${input.reference} when paying and send your payment confirmation to EstateDesk billing.`);
  document.paragraph("Access is renewed after payment is confirmed. This invoice is not a payment receipt.");
  return document.save();
}

export async function createSubscriptionReceipt(reference: string, data: SubscriptionInvoiceData, paymentId: string) {
  const payment = data.payments.find(row => row.id === paymentId);
  if (!payment) throw Error("Payment not found.");
  const receiptNumber = payment.receiptNumber ?? `${reference}-R${data.payments.indexOf(payment) + 1}`;
  const document = await createProfessionalPdf({ title: "Subscription payment receipt", serialNumber: receiptNumber, organizationName: "EstateDesk", issuedAt: new Date(payment.recordedAt), footerText: "EstateDesk | Subscription payment receipt" });
  document.paragraph("EstateDesk", { strong: true, size: 18 });
  document.section("Payment received");
  document.details([["Received from", data.organisation], ["Receipt number", receiptNumber], ["Invoice", reference], ["Plan", data.plan], ["Payment reference", payment.reference], ["Payment date", new Date(payment.paidAt).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })], ["Amount received", `KES ${(payment.amountMinor / 100).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`]]);
  document.paragraph("This receipt confirms the payment recorded and verified by EstateDesk.");
  return document.save();
}
