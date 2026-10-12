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
  issuedAt: Date; renewalDate: Date; paymentInstructions: string;
}) {
  if (!input.paymentInstructions.trim()) throw new Error("Configure EstateDesk subscription payment instructions before sending an invoice.");
  const document = await createProfessionalPdf({ title: "Subscription invoice", serialNumber: input.reference, organizationName: "EstateDesk", issuedAt: input.issuedAt, footerText: "EstateDesk | Subscription invoice - not a payment receipt." });
  document.paragraph("EstateDesk", { strong: true, size: 18 });
  document.section("Bill to");
  document.details([["Organisation", input.organisation], ["Invoice reference", input.reference], ["Issued", input.issuedAt.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })], ["Renewal date", input.renewalDate.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })]]);
  document.section("Subscription");
  document.details([["Plan", input.plan], ["Renewal duration", "30 days"], ["Total payable", `KES ${input.amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]]);
  document.section("Payment instructions");
  document.paragraph(input.paymentInstructions);
  document.paragraph(`Quote invoice reference ${input.reference} when paying and send your payment confirmation to EstateDesk billing.`);
  document.paragraph("Access is renewed after payment is confirmed. This invoice is not a payment receipt.");
  return document.save();
}
