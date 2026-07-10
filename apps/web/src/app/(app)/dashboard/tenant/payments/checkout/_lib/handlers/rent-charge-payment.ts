import {
  channelForMethod,
  checkoutMethodLabel,
  submissionNotesForMethod,
} from "@/lib/payments/method-flow";
import { notifyRecipients } from "@/lib/notifications/notify";
import { buildPaymentReference } from "../reference";
import { getPaymentReviewRecipients } from "../payment-review-recipients";
import type { PaymentHandlerContext } from "../payment-handler-context";

export async function processRentChargePayment(
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

  const charge = await tx.rentCharge.findFirst({
    where: {
      id: sourceId,
      orgId,
      lease: {
        tenantId: tenant.id,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      period: true,
      chargeType: true,
      amountDue: true,
      amountPaid: true,
      balance: true,
      lease: {
        select: {
          id: true,
          unit: {
            select: {
              houseNo: true,
              property: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!charge) {
    throw new Error("Rent charge not found.");
  }

  const outstanding = Number(charge.balance ?? charge.amountDue);
  if (outstanding <= 0) {
    throw new Error("This charge is already cleared.");
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
      targetType: charge.chargeType === "DEPOSIT" ? "DEPOSIT" : "RENT",
      rentChargeId: charge.id,
      gatewayStatus: isGateway ? "INITIATED" : "PENDING",
      verificationStatus: isGateway ? "NOT_REQUIRED" : "PENDING",
      phoneUsed: phoneNumber || null,
      reference: buildPaymentReference({
        source,
        period: charge.period,
        unitLabel: charge.lease.unit.houseNo,
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
        leaseId: charge.lease.id,
        period: charge.period,
        balanceBefore: outstanding,
        isPartial: amount + 0.001 < outstanding,
        transactionMessage: proofMessage || null,
        submittedAt: paidAt.toISOString(),
      },
    },
    select: { id: true },
  });

  if (isGateway) {
    await notifyRecipients({
      db: tx,
      orgId,
      recipients: [{ tenantId: tenant.id, userId }],
      type: "GENERAL",
      title: "Complete M-Pesa prompt",
      message: `Enter your M-Pesa PIN to pay ${amount.toFixed(0)} for ${charge.period}. Your bill updates automatically when payment succeeds.`,
    });
  } else {
    await notifyRecipients({
      db: tx,
      orgId,
      recipients: [{ tenantId: tenant.id, userId }],
      type: "GENERAL",
      title: "Payment submitted",
      message: `Your ${charge.chargeType.toLowerCase().replaceAll("_", " ")} payment for ${charge.period} via ${methodLabel} has been submitted and is awaiting organization verification.`,
    });

    await notifyRecipients({
      db: tx,
      orgId,
      recipients: await getPaymentReviewRecipients(tx, orgId),
      channels: ["IN_APP"],
      type: "GENERAL",
      title: "Manual payment needs verification",
      message: `${tenant.fullName} submitted ${charge.period} ${methodLabel} payment for ${charge.lease.unit.property.name} / Unit ${charge.lease.unit.houseNo}.`,
    });
  }

  return payment;
}
