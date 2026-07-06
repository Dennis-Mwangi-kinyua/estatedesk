import { notifyRecipients } from "@/lib/notifications/notify";
import { buildPaymentReference } from "../reference";
import { getPaymentReviewRecipients } from "../payment-review-recipients";
import type { PaymentHandlerContext } from "../payment-handler-context";

export async function processRentChargePayment(ctx: PaymentHandlerContext) {
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

  const amount = Number(charge.balance ?? charge.amountDue);
  if (amount <= 0) {
    throw new Error("This charge is already cleared.");
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
      targetType: charge.chargeType === "DEPOSIT" ? "DEPOSIT" : "RENT",
      rentChargeId: charge.id,
      gatewayStatus: "PENDING",
      verificationStatus: "PENDING",
      phoneUsed: phoneNumber || null,
      reference: buildPaymentReference({
        source,
        period: charge.period,
        unitLabel: charge.lease.unit.houseNo,
      }),
      externalReference: transactionId || null,
      transactionReferenceKey,
      paidAt: null,
      notes: "Tenant submitted payment awaiting organization verification.",
      callbackRaw: {
        source,
        accountName: accountName || null,
        sourceId,
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
    title: "Payment submitted",
    message: `Your ${charge.chargeType.toLowerCase().replaceAll("_", " ")} payment for ${charge.period} has been submitted and is awaiting verification.`,
  });

  await notifyRecipients({
    db: tx,
    orgId,
    recipients: await getPaymentReviewRecipients(tx, orgId),
    channels: ["IN_APP"],
    type: "GENERAL",
    title: "Payment needs verification",
    message: `${tenant.fullName} submitted ${charge.period} payment for ${charge.lease.unit.property.name} / Unit ${charge.lease.unit.houseNo}.`,
  });
}