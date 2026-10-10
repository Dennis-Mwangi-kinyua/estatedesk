"use server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { verifyPayment } from "@/app/(app)/dashboard/org/payments/_lib/verify-payment";
import { revalidatePaymentSurfaces } from "@/app/(app)/dashboard/org/payments/_lib/payment-action-shared";
import { revalidatePath } from "next/cache";
import { nairobiDate, parseMoveOutDate } from "@/lib/move-outs/validation";
import { normalizeTransactionReference, buildMpesaTransactionKey } from "@/lib/payments/transaction-reference";
import { safeServerActionError } from "@/lib/errors/server-error-log";

export async function confirmChargePaymentAction(form: FormData) {
  try {
    const session = await requireOrgPermission("payments.verify");
    const orgId = session.activeOrgId!;
    const chargeId = String(form.get("chargeId") ?? "").trim();
    const reference = normalizeTransactionReference(String(form.get("reference") ?? ""));
    const method = String(form.get("paymentMethod") ?? "");
    if (!["CASH", "BANK", "MPESA_MANUAL"].includes(method)) throw new Error("Choose a payment method.");
    if (!reference || reference.length > 100) throw new Error("Enter the payment reference or cash receipt number (up to 100 characters).");
    if (form.get("received") !== "on") throw new Error("Confirm that the payment was received.");
    const paidAt = parseMoveOutDate(String(form.get("paidAt") ?? ""));
    if (nairobiDate(paidAt) > nairobiDate()) throw new Error("Payment date cannot be in the future.");
    const result = await prisma.$transaction(async tx => {
      const charge = await tx.rentCharge.findFirst({ where: { id: chargeId, orgId, status: { not: "WAIVED" }, lease: { deletedAt: null, status: { in: ["ACTIVE", "TERMINATED"] } } }, include: { lease: { include: { tenant: true } } } });
      if (!charge) throw new Error("Charge not found in this organisation.");
      if (charge.balance.lte(0)) throw new Error("This charge is already paid. Open its receipt instead.");
      const expectedBalance = String(form.get("expectedBalance") ?? "");
      if (expectedBalance !== charge.balance.toFixed(2)) throw new Error("The balance changed. Refresh and review the amount before confirming.");
      const rawAmount = String(form.get("amount") ?? "").trim();
      if (!/^\d{1,10}(\.\d{1,2})?$/.test(rawAmount)) throw new Error("Enter a valid payment amount with up to two decimal places.");
      const amount = new Prisma.Decimal(rawAmount);
      if (amount.lte(0) || amount.gt(charge.balance)) throw new Error("Payment must be greater than zero and no more than the remaining balance.");
      const pending = await tx.payment.findFirst({ where: { orgId, payerTenantId: charge.lease.tenantId, OR: [{ rentChargeId: charge.id }, { targetType: "COMBINED", AND: [{ callbackRaw: { path: ["leaseId"], equals: charge.leaseId } }, { callbackRaw: { path: ["period"], equals: charge.period } }] }], verificationStatus: "PENDING", gatewayStatus: { in: ["PENDING", "INITIATED", "SUCCESS"] }, reversedAt: null }, select: { id: true } });
      if (pending) throw new Error("A submitted payment is awaiting review. Verify it in Payments to avoid recording it twice.");
      if (await tx.payment.findFirst({ where: { orgId, method: method as "CASH" | "BANK" | "MPESA_MANUAL", externalReference: reference, verificationStatus: { not: "REJECTED" }, reversedAt: null }, select: { id: true } })) throw new Error("This payment reference has already been recorded.");
      const key = method === "MPESA_MANUAL" ? buildMpesaTransactionKey(reference) : `${method}:${orgId}:${reference}`;
      if (await tx.payment.findUnique({ where: { transactionReferenceKey: key }, select: { id: true } })) throw new Error("This payment reference has already been recorded.");
      const note = `${charge.chargeType === "DEPOSIT" ? "Deposit" : "Charge"} payment received and confirmed by organisation.`;
      const payment = await tx.payment.create({ data: {
        orgId, payerTenantId: charge.lease.tenantId, payerUserId: charge.lease.tenant.userId,
        payerName: charge.lease.tenant.fullName, payerType: "TENANT",
        method: method as "CASH" | "BANK" | "MPESA_MANUAL", amount,
        targetType: charge.chargeType === "DEPOSIT" ? "DEPOSIT" : "RENT", rentChargeId: charge.id,
        reference, externalReference: reference, transactionReferenceKey: key, paidAt,
        gatewayStatus: "PENDING", verificationStatus: "PENDING", notes: note,
        callbackRaw: { source: "staff_charge_confirmation", leaseId: charge.leaseId, period: charge.period },
      } });
      await verifyPayment(tx, session, payment.id, note);
      if (method === "CASH") await tx.payment.update({ where: { id: payment.id }, data: { reconciliationStatus: "RECONCILED", reconciledAt: new Date(), reconciledByUserId: session.userId, reconciliationNotes: note } });
      const receipt = await tx.receipt.findUniqueOrThrow({ where: { paymentId: payment.id }, select: { id: true } });
      return { receiptId: receipt.id, tenantSlug: charge.lease.tenant.slug ?? charge.lease.tenantId, leaseId: charge.leaseId };
    }, { isolationLevel: "Serializable", timeout: 15_000 });
    revalidatePaymentSurfaces();
    revalidatePath(`/dashboard/org/tenants/${result.tenantSlug}`);
    revalidatePath("/dashboard/tenant/lease");
    return { status: "success" as const, receiptId: result.receiptId };
  } catch (error) {
    return { status: "error" as const, message: safeServerActionError("confirmChargePaymentAction", error, "Could not confirm payment. Refresh and try again.") };
  }
}
