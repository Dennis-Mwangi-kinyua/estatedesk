import "server-only";
import { Prisma } from "@prisma/client";
import { buildMpesaTransactionKey } from "@/lib/payments/transaction-reference";
import { settleGatewayPayment } from "@/lib/payments/settle-payment";
import { mpesaFailureMessage } from "./result-message";

export type StkCallback = {
  MerchantRequestID?: string; CheckoutRequestID: string; ResultCode: number; ResultDesc?: string;
  CallbackMetadata?: { Item?: { Name?: string; Value?: string | number }[] };
};

export async function settleMpesaCallback(tx: Prisma.TransactionClient, orgId: string, callback: StkCallback) {
  const payment = await tx.payment.findUnique({ where: { checkoutRequestId: callback.CheckoutRequestID } });
  if (!payment) return { matched: false };
  if (payment.orgId !== orgId || payment.method !== "MPESA_STK") throw new Error("M-Pesa connection does not own this payment.");
  if (payment.reversedAt || payment.verificationStatus === "REVERSED") return { matched: true, ignored: true };
  if (payment.verificationStatus === "VERIFIED") return { matched: true, alreadySettled: true };
  if (payment.merchantRequestId && callback.MerchantRequestID !== payment.merchantRequestId) throw new Error("Merchant request mismatch.");
  const metadata = payment.callbackRaw && typeof payment.callbackRaw === "object" && !Array.isArray(payment.callbackRaw) ? payment.callbackRaw : {};
  if (callback.ResultCode !== 0) {
    const message = mpesaFailureMessage(callback.ResultCode, callback.ResultDesc);
    await tx.payment.update({ where: { id: payment.id }, data: { gatewayStatus: "FAILED", verificationStatus: "REJECTED", reconciliationStatus: "DISPUTED", reconciliationNotes: message, notes: message, callbackRaw: { ...metadata, mpesaCallback: callback as Prisma.InputJsonValue } } });
    return { matched: true };
  }
  const items = callback.CallbackMetadata?.Item ?? [];
  const value = (name: string) => items.find(item => item.Name === name)?.Value;
  const receipt = String(value("MpesaReceiptNumber") ?? "").trim().toUpperCase();
  const amount = Number(value("Amount"));
  if (!receipt || !Number.isFinite(amount) || amount <= 0 || !payment.amount.equals(new Prisma.Decimal(amount))) throw new Error("Confirmed amount or receipt does not match the requested payment.");
  await tx.payment.update({ where: { id: payment.id }, data: { gatewayStatus: "SUCCESS", externalReference: receipt, transactionReferenceKey: buildMpesaTransactionKey(receipt), phoneUsed: String(value("PhoneNumber") ?? payment.phoneUsed ?? ""), paidAt: new Date(), callbackRaw: { ...metadata, mpesaCallback: callback as Prisma.InputJsonValue } } });
  await settleGatewayPayment({ db: tx, paymentId: payment.id });
  return { matched: true };
}
