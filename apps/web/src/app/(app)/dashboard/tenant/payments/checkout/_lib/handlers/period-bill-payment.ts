import {
  channelForMethod,
  checkoutMethodLabel,
  submissionNotesForMethod,
} from "@/lib/payments/method-flow";
import { notifyRecipients } from "@/lib/notifications/notify";
import { getPeriodBillForTenant } from "@/lib/billing/period-bill";
import { buildPaymentReference } from "../reference";
import { getPaymentReviewRecipients } from "../payment-review-recipients";
import type { PaymentHandlerContext } from "../payment-handler-context";

/**
 * Pay a combined period bill (rent + water for one YYYY-MM).
 * `sourceId` is the period string. Optional amount supports partial pay.
 */
export async function processPeriodBillPayment(
  ctx: PaymentHandlerContext,
  options: { amount?: number },
) {
  const {
    tx,
    orgId,
    userId,
    tenant,
    paymentMethod,
    checkoutMethod,
    settlementMode,
    paidAt,
    transactionId,
    transactionReferenceKey,
    phoneNumber,
    accountName,
    source,
    sourceId,
    proofMessage,
    checkoutRequestId,
    merchantRequestId,
  } = ctx;

  const period = sourceId;
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error("Invalid billing period.");
  }

  const periodBill = await getPeriodBillForTenant({
    db: tx,
    orgId,
    tenantId: tenant.id,
    period,
  });

  if (!periodBill) {
    throw new Error("No active lease found for this period bill.");
  }

  if (periodBill.balance <= 0) {
    throw new Error("This period bill is already cleared.");
  }

  const requested =
    options.amount != null && Number.isFinite(options.amount)
      ? Number(options.amount)
      : periodBill.balance;

  if (!Number.isFinite(requested) || requested <= 0) {
    throw new Error("Enter a valid payment amount.");
  }

  if (requested > periodBill.balance + 0.001) {
    throw new Error(
      `Amount cannot exceed the outstanding balance of ${periodBill.balance.toFixed(0)}.`,
    );
  }

  const amount = Math.round(requested * 100) / 100;
  const methodLabel = checkoutMethodLabel(checkoutMethod);
  const isPartial = amount + 0.001 < periodBill.balance;

  const isGateway = settlementMode === "gateway";

  // Manual only: mark water pending verification until org confirms.
  if (!isGateway) {
    const rentBalance = periodBill.lines
      .filter((l) => l.kind === "RENT" || l.kind === "OTHER")
      .reduce((s, l) => s + l.balance, 0);
    const touchesWater =
      Boolean(periodBill.waterBillId) && amount > rentBalance - 0.001;

    if (touchesWater && periodBill.waterBillId) {
      await tx.waterBill.update({
        where: { id: periodBill.waterBillId },
        data: { status: "PAID_PENDING_VERIFICATION" },
      });
    }
  }

  const payment = await tx.payment.create({
    data: {
      orgId,
      payerTenantId: tenant.id,
      payerUserId: userId,
      payerType: "TENANT",
      payerName: tenant.fullName,
      method: paymentMethod,
      amount,
      targetType: "COMBINED",
      rentChargeId: periodBill.rentChargeId,
      waterBillId: periodBill.waterBillId,
      gatewayStatus: isGateway ? "INITIATED" : "PENDING",
      verificationStatus: isGateway ? "NOT_REQUIRED" : "PENDING",
      phoneUsed: phoneNumber || null,
      reference: buildPaymentReference({
        source,
        period,
        unitLabel: periodBill.unitHouseNo,
      }),
      externalReference: transactionId || null,
      transactionReferenceKey,
      checkoutRequestId: checkoutRequestId || null,
      merchantRequestId: merchantRequestId || null,
      paidAt: null,
      notes: isGateway
        ? `STK push initiated via ${methodLabel}. Bill will update automatically on success.`
        : submissionNotesForMethod(checkoutMethod),
      callbackRaw: {
        source: "period_bill",
        combined: true,
        settlementMode,
        period,
        leaseId: periodBill.leaseId,
        rentChargeId: periodBill.rentChargeId,
        waterBillId: periodBill.waterBillId,
        amountDue: periodBill.amountDue,
        balanceBefore: periodBill.balance,
        isPartial,
        checkoutMethod,
        channel: channelForMethod(checkoutMethod),
        methodLabel,
        accountName: accountName || null,
        sourceId: period,
        transactionMessage: proofMessage || null,
        lines: periodBill.lines,
        submittedAt: paidAt.toISOString(),
      },
    },
    select: { id: true },
  });

  const lineSummary = periodBill.lines
    .filter((l) => l.balance > 0)
    .map((l) => `${l.label} ${l.balance.toFixed(0)}`)
    .join(" + ");

  if (isGateway) {
    await notifyRecipients({
      db: tx,
      orgId,
      recipients: [{ tenantId: tenant.id, userId }],
      type: "GENERAL",
      title: "Complete M-Pesa prompt",
      message: `Enter your M-Pesa PIN on your phone to pay ${amount.toFixed(0)} for ${period} (${lineSummary}). Your bill updates automatically when payment succeeds.`,
    });
  } else {
    await notifyRecipients({
      db: tx,
      orgId,
      recipients: [{ tenantId: tenant.id, userId }],
      type: "GENERAL",
      title: isPartial
        ? "Partial bill payment submitted"
        : "Bill payment submitted",
      message: `Your ${period} bill payment of ${amount.toFixed(0)} via ${methodLabel} has been submitted and is awaiting organization verification. (${lineSummary})`,
    });

    await notifyRecipients({
      db: tx,
      orgId,
      recipients: await getPaymentReviewRecipients(tx, orgId),
      channels: ["IN_APP"],
      type: "GENERAL",
      title: "Manual bill payment needs verification",
      message: `${tenant.fullName} submitted ${period} ${methodLabel} payment (${amount.toFixed(0)}) for ${periodBill.propertyName} / Unit ${periodBill.unitHouseNo}${isPartial ? " (partial)" : ""}.`,
    });
  }

  return payment;
}
