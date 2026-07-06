import { notifyRecipients } from "@/lib/notifications/notify";
import { isPayableWaterBillStatus } from "@/lib/water-bills/status";
import { buildPaymentReference } from "../reference";
import { getPaymentReviewRecipients } from "../payment-review-recipients";
import type { PaymentHandlerContext } from "../payment-handler-context";

export async function processWaterBillPayment(ctx: PaymentHandlerContext) {
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

  const bill = await tx.waterBill.findFirst({
    where: {
      id: sourceId,
      orgId,
      tenantId: tenant.id,
    },
    select: {
      id: true,
      period: true,
      total: true,
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

  const amount = Number(bill.total ?? 0);

  await tx.payment.create({
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
      gatewayStatus: "PENDING",
      verificationStatus: "PENDING",
      phoneUsed: phoneNumber || null,
      reference: buildPaymentReference({
        source,
        period: bill.period,
        unitLabel: bill.unit.houseNo,
      }),
      externalReference: transactionId || null,
      transactionReferenceKey,
      paidAt: null,
      notes: "Tenant submitted water bill payment awaiting organization verification.",
      callbackRaw: {
        source,
        accountName: accountName || null,
        sourceId,
        submittedAt: paidAt.toISOString(),
      },
    },
    select: { id: true },
  });

  await tx.waterBill.update({
    where: { id: bill.id },
    data: {
      status: "PAID_PENDING_VERIFICATION",
    },
  });

  await notifyRecipients({
    db: tx,
    orgId,
    recipients: [{ tenantId: tenant.id, userId }],
    type: "GENERAL",
    title: "Water payment submitted",
    message: `Your water bill payment for ${bill.period} has been submitted and is awaiting verification.`,
  });

  await notifyRecipients({
    db: tx,
    orgId,
    recipients: await getPaymentReviewRecipients(tx, orgId),
    channels: ["IN_APP"],
    type: "GENERAL",
    title: "Water payment needs verification",
    message: `${tenant.fullName} submitted water bill ${bill.period} for ${bill.unit.property.name} / Unit ${bill.unit.houseNo}.`,
  });
}