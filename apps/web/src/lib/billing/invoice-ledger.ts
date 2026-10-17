/** SaaS subscription records; separate from tenant rent payments. Amounts use KES cents. */
export const SUBSCRIPTION_INVOICE_ENTITY = "ESTATEDESK_SUBSCRIPTION_INVOICE";
export type SubscriptionPayment = { id: string; reference: string; amountMinor: number; paidAt: string; recordedAt: string; recordedBy: string };
export type SubscriptionInvoiceData = {
  version: 1; organisation: string; plan: string; amountMinor: number; issuedAt: string;
  renewalDate: string; paymentInstructions: string; payments: SubscriptionPayment[];
};
export function moneyMinor(value: string) {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) throw Error("Enter a positive amount with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result <= 0) throw Error("Enter a positive payment amount.");
  return result;
}
export function invoiceData(value: unknown): SubscriptionInvoiceData {
  if (!value || typeof value !== "object") throw Error("Invalid invoice record.");
  const data = value as SubscriptionInvoiceData;
  if (data.version !== 1 || !Number.isSafeInteger(data.amountMinor) || data.amountMinor <= 0 || !Array.isArray(data.payments) ||
    ![data.organisation,data.plan,data.paymentInstructions].every(v=>typeof v === "string" && v.length > 0) ||
    !Number.isFinite(Date.parse(data.issuedAt)) || !Number.isFinite(Date.parse(data.renewalDate)) ||
    data.payments.some(p=>!p.id || !p.reference || !p.recordedBy || !Number.isSafeInteger(p.amountMinor) || p.amountMinor <= 0 || !Number.isFinite(Date.parse(p.paidAt)) || !Number.isFinite(Date.parse(p.recordedAt)))) throw Error("Invalid invoice record.");
  if (invoiceBalance(data) < 0) throw Error("Invoice payments exceed its amount.");
  return data;
}
export function invoiceBalance(data: SubscriptionInvoiceData) {
  return data.amountMinor - data.payments.reduce((total,payment)=>total + payment.amountMinor,0);
}
export function appendInvoicePayment(data: SubscriptionInvoiceData, payment: SubscriptionPayment) {
  const existing = data.payments.find(p=>p.id === payment.id);
  if (existing) {
    if (existing.reference !== payment.reference || existing.amountMinor !== payment.amountMinor || existing.paidAt !== payment.paidAt) throw Error("Payment submission changed. Refresh and try again.");
    return data;
  }
  if (data.payments.some(p=>p.reference.toLowerCase() === payment.reference.toLowerCase())) throw Error("This payment reference has already been recorded.");
  if (payment.amountMinor > invoiceBalance(data)) throw Error("Payment exceeds the invoice's outstanding balance.");
  return invoiceData({...data,payments:[...data.payments,payment]});
}
