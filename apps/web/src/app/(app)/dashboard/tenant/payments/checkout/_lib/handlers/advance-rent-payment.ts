import {
  channelForMethod,
  checkoutMethodLabel,
  submissionNotesForMethod,
} from "@/lib/payments/method-flow";
import { getCurrentPeriod } from "@/lib/ledger";
import { notifyRecipients } from "@/lib/notifications/notify";
import { buildPaymentReference } from "../reference";
import { getPaymentReviewRecipients } from "../payment-review-recipients";
import type { PaymentHandlerContext } from "../payment-handler-context";

export async function processAdvanceRentPayment(
  ctx: PaymentHandlerContext,
  input: { amount: number; months: number },
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

  const months = Math.min(Math.max(Number(input.months ?? 1), 1), 36);
  const amount = Number(input.amount ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Advance rent amount must be greater than zero.");
  }

  const lease = await tx.lease.findFirst({
    where: {
      id: sourceId,
      orgId,
      tenantId: tenant.id,
      status: "ACTIVE",
      deletedAt: null,
    },
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
  });

  if (!lease) {
    throw new Error("Active lease not found.");
  }

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
      targetType: "RENT",
      gatewayStatus: isGateway ? "INITIATED" : "PENDING",
      verificationStatus: isGateway ? "NOT_REQUIRED" : "PENDING",
      phoneUsed: phoneNumber || null,
      reference: buildPaymentReference({
        source,
        period: getCurrentPeriod(),
        unitLabel: lease.unit.houseNo,
      }),
      externalReference: transactionId || null,
      transactionReferenceKey,
      checkoutRequestId: checkoutRequestId || null,
      merchantRequestId: merchantRequestId || null,
      paidAt: null,
      notes: isGateway
        ? `STK push initiated for advance rent (${months} month${months === 1 ? "" : "s"}).`
        : `${submissionNotesForMethod(checkoutMethod)} Advance for up to ${months} month${months === 1 ? "" : "s"}.`,
      callbackRaw: {
        source,
        settlementMode,
        checkoutMethod,
        channel: channelForMethod(checkoutMethod),
        methodLabel,
        accountName: accountName || null,
        sourceId,
        leaseId: lease.id,
        months,
        startPeriod: getCurrentPeriod(),
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
      message: `Enter your M-Pesa PIN for advance rent. Your ledger updates automatically when payment succeeds.`,
    });
  } else {
    await notifyRecipients({
      db: tx,
      orgId,
      recipients: [{ tenantId: tenant.id, userId }],
      type: "GENERAL",
      title: "Advance rent submitted",
      message: `Your advance rent payment via ${methodLabel} has been submitted and is awaiting organization verification.`,
    });

    await notifyRecipients({
      db: tx,
      orgId,
      recipients: await getPaymentReviewRecipients(tx, orgId),
      channels: ["IN_APP"],
      type: "GENERAL",
      title: "Manual advance rent needs verification",
      message: `${tenant.fullName} submitted ${methodLabel} advance rent for ${lease.unit.property.name} / Unit ${lease.unit.houseNo}.`,
    });
  }

  return payment;
}
