import {
  channelForMethod,
  checkoutMethodLabel,
  submissionNotesForMethod,
} from "@/lib/payments/method-flow";
import { notifyRecipients } from "@/lib/notifications/notify";
import {
  isPayableWaterBillStatus,
  tenantVisibleWaterBillWhere,
} from "@/lib/water-bills/status";
import { buildPaymentReference } from "../reference";
import { getPaymentReviewRecipients } from "../payment-review-recipients";
import type { PaymentHandlerContext } from "../payment-handler-context";

export async function processWaterBillPayment(
  ctx: PaymentHandlerContext,
  options: { amount?: number } = {},
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
  const isGateway = settlementMode === "gateway";

  const bill = await tx.waterBill.findFirst({
    where: {
      id: sourceId,
      orgId,
      tenantId: tenant.id,
      ...tenantVisibleWaterBillWhere(),
    },
    select: {
      id: true,
      period: true,
      total: true,
      amountPaid: true,
      balance: true,
      status: true,
      unit: {
        select: {
          houseNo: true,
          property: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!bill) {
    throw new Error("Water bill not found.");
  }

  if (bill.status === "PAID_VERIFIED") {
    throw new Error("This water bill is already cleared.");
  }

  if (bill.status === "PENDING_APPROVAL") {
    throw new Error(
      "This water bill is awaiting organization approval and cannot be paid yet.",
    );
  }

  if (bill.status === "CANCELLED") {
    throw new Error("This water bill was cancelled.");
  }

  if (!isPayableWaterBillStatus(bill.status)) {
    throw new Error("This water bill is not open for payment.");
  }

  const outstanding = Math.max(
    Number(bill.balance ?? 0) > 0
      ? Number(bill.balance)
      : Number(bill.total) - Number(bill.amountPaid ?? 0),
    0,
  );

  if (outstanding <= 0) {
    throw new Error("This water bill is already cleared.");
  }

  const requested =
    options.amount != null && Number.isFinite(options.amount)
      ? Number(options.amount)
      : outstanding;

  if (!Number.isFinite(requested) || requested <= 0) {
    throw new Error("Enter a valid payment amount.");
  }

  if (requested > outstanding + 0.001) {
    throw new Error(
      `Amount cannot exceed the outstanding balance of ${outstanding.toFixed(0)}.`,
    );
  }

  const amount = Math.round(requested * 100) / 100;
  const methodLabel = checkoutMethodLabel(checkoutMethod);

  const payment = await tx.payment.create({
    data: {
      orgId,
      payerTenantId: tenant.id,
      payerUserId: userId,
      payerType: "TENANT",
      payerName: tenant.fullName,
      method: paymentMethod,
      amount,
      targetType: "WATER",
      waterBillId: bill.id,
      gatewayStatus: isGateway ? "INITIATED" : "PENDING",
      verificationStatus: isGateway ? "NOT_REQUIRED" : "PENDING",
      phoneUsed: phoneNumber || null,
      reference: buildPaymentReference({
        source,
        period: bill.period,
        unitLabel: bill.unit.houseNo,
      }),
      externalReference: transactionId || null,
      transactionReferenceKey,
      checkoutRequestId: checkoutRequestId || null,
      merchantRequestId: merchantRequestId || null,
      paidAt: null,
      notes: isGateway
        ? `STK push initiated via ${methodLabel}.`
        : submissionNotesForMethod(checkoutMethod),
      callbackRaw: {
        source,
        settlementMode,
        checkoutMethod,
        channel: channelForMethod(checkoutMethod),
        methodLabel,
        accountName: accountName || null,
        sourceId,
        period: bill.period,
        balanceBefore: outstanding,
        isPartial: amount + 0.001 < outstanding,
        transactionMessage: proofMessage || null,
        submittedAt: paidAt.toISOString(),
      },
    },
    select: { id: true },
  });

  if (!isGateway) {
    await tx.waterBill.update({
      where: { id: bill.id },
      data: {
        status: "PAID_PENDING_VERIFICATION",
      },
    });
  }

  if (isGateway) {
    await notifyRecipients({
      db: tx,
      orgId,
      recipients: [{ tenantId: tenant.id, userId }],
      type: "GENERAL",
      title: "Complete M-Pesa prompt",
      message: `Enter your M-Pesa PIN to pay water bill ${bill.period}. Your bill updates automatically when payment succeeds.`,
    });
  } else {
    await notifyRecipients({
      db: tx,
      orgId,
      recipients: [{ tenantId: tenant.id, userId }],
      type: "GENERAL",
      title: "Water payment submitted",
      message: `Your water bill payment for ${bill.period} via ${methodLabel} has been submitted and is awaiting organization verification.`,
    });

    await notifyRecipients({
      db: tx,
      orgId,
      recipients: await getPaymentReviewRecipients(tx, orgId),
      channels: ["IN_APP"],
      type: "GENERAL",
      title: "Manual water payment needs verification",
      message: `${tenant.fullName} submitted ${methodLabel} water bill ${bill.period} for ${bill.unit.property.name} / Unit ${bill.unit.houseNo}.`,
    });
  }

  return payment;
}
