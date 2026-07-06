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
    paidAt,
    transactionId,
    transactionReferenceKey,
    phoneNumber,
    accountName,
    source,
    sourceId,
  } = ctx;

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

  await tx.payment.create({
    data: {
      orgId,
      payerTenantId: tenant.id,
      payerUserId: userId,
      payerType: "TENANT",
      payerName: tenant.fullName,
      method: paymentMethod,
      amount,
      targetType: "RENT",
      gatewayStatus: "PENDING",
      verificationStatus: "PENDING",
      phoneUsed: phoneNumber || null,
      reference: buildPaymentReference({
        source,
        period: getCurrentPeriod(),
        unitLabel: lease.unit.houseNo,
      }),
      externalReference: transactionId || null,
      transactionReferenceKey,
      paidAt: null,
      notes: `Tenant submitted advance rent for up to ${months} month${months === 1 ? "" : "s"} awaiting organization verification.`,
      callbackRaw: {
        source,
        accountName: accountName || null,
        sourceId,
        leaseId: lease.id,
        months,
        startPeriod: getCurrentPeriod(),
        submittedAt: paidAt.toISOString(),
      },
    },
    select: { id: true },
  });

  await notifyRecipients({
    db: tx,
    orgId,
    recipients: [{ tenantId: tenant.id, userId }],
    type: "GENERAL",
    title: "Advance rent submitted",
    message: `Your advance rent payment has been submitted and is awaiting verification.`,
  });

  await notifyRecipients({
    db: tx,
    orgId,
    recipients: await getPaymentReviewRecipients(tx, orgId),
    channels: ["IN_APP"],
    type: "GENERAL",
    title: "Advance rent needs verification",
    message: `${tenant.fullName} submitted advance rent for ${lease.unit.property.name} / Unit ${lease.unit.houseNo}.`,
  });
}