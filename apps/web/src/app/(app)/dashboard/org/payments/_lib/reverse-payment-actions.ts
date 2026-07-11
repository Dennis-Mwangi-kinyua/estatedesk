"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  asObject,
  getNumber,
  getString,
  paymentsMessageUrl,
  readString,
  requirePaymentManager,
  revalidatePaymentSurfaces,
} from "./payment-action-shared";
import { reversePaymentPosting } from "@/lib/accounting/payments";
import { prisma } from "@/lib/prisma";
import { notifyRecipients } from "@/lib/notifications/notify";
import { chargeAfterPaymentReversal } from "@/lib/payments/lifecycle";

export async function reverseVerifiedPaymentAction(formData: FormData) {
  const session = await requirePaymentManager();
  const paymentId = readString(formData, "paymentId");
  const reason = readString(formData, "reason");

  if (!paymentId) throw new Error("Payment id is required.");
  if (reason.length < 10) {
    throw new Error("Provide a clear reversal reason of at least 10 characters.");
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { id: paymentId, orgId: session.activeOrgId! },
      include: {
        allocations: {
          include: {
            rentCharge: {
              select: { id: true, amountDue: true, amountPaid: true, balance: true },
            },
          },
        },
        waterBill: {
          select: { id: true, total: true, amountPaid: true, balance: true },
        },
        receipt: { select: { documentId: true } },
        payerTenant: { select: { id: true, userId: true } },
      },
    });

    if (!payment) throw new Error("Payment not found.");
    if (payment.verificationStatus !== "VERIFIED") {
      throw new Error("Only verified payments can be reversed.");
    }
    if (payment.remittedToKra) {
      throw new Error("A KRA-remitted payment requires a tax correction before reversal.");
    }

    for (const allocation of payment.allocations) {
      const corrected = chargeAfterPaymentReversal({
        amountDue: Number(allocation.rentCharge.amountDue),
        amountPaid: Number(allocation.rentCharge.amountPaid),
        allocationAmount: Number(allocation.amount),
      });

      await tx.rentCharge.update({
        where: { id: allocation.rentCharge.id },
        data: {
          amountPaid: corrected.amountPaid,
          balance: corrected.balance,
          status: corrected.status,
        },
      });
    }

    await tx.paymentAllocation.deleteMany({ where: { paymentId: payment.id } });

    if (payment.waterBill) {
      const allocationTotal = payment.allocations.reduce(
        (sum, row) => sum + Number(row.amount),
        0,
      );
      const waterPortion = Math.max(Number(payment.amount) - allocationTotal, 0);
      const currentPaid = Number(
        (payment.waterBill as { amountPaid?: unknown }).amountPaid ?? 0,
      );
      const total = Number(
        (payment.waterBill as { total?: unknown }).total ?? 0,
      );
      const nextPaid = Math.max(currentPaid - waterPortion, 0);
      const nextBalance = Math.max(total - nextPaid, 0);

      await tx.waterBill.update({
        where: { id: payment.waterBill.id },
        data: {
          amountPaid: nextPaid,
          balance: nextBalance,
          status: nextBalance <= 0 ? "PAID_VERIFIED" : "ISSUED",
        },
      });
    }

    const reversedAt = new Date();
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        verificationStatus: "REVERSED",
        reconciliationStatus: "DISPUTED",
        reconciliationNotes: `Reversed: ${reason}`,
        reversedAt,
        reversedByUserId: session.userId,
        reversalReason: reason,
        unappliedAmount: 0,
        coveredPeriods: [],
      },
    });

    if (payment.receipt?.documentId) {
      await tx.documentRecord.update({
        where: { id: payment.receipt.documentId },
        data: { status: "REVOKED", revokedAt: reversedAt, revocationReason: reason },
      });
      await tx.documentEvent.create({
        data: {
          orgId: session.activeOrgId!,
          documentId: payment.receipt.documentId,
          eventType: "REVOKED",
          actorUserId: session.userId,
          metadata: { reason, paymentId: payment.id },
        },
      });
    }

    await reversePaymentPosting(tx, payment.id, reason, session.userId);

    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "PAYMENT_REVERSED",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          amount: Number(payment.amount),
          method: payment.method,
          reference:
            payment.externalReference ?? payment.reference ?? payment.checkoutRequestId,
          reason,
          reversedAt: reversedAt.toISOString(),
        },
        beforeState: {
          verificationStatus: payment.verificationStatus,
          reconciliationStatus: payment.reconciliationStatus,
        },
        afterState: {
          verificationStatus: "REVERSED",
          reconciliationStatus: "DISPUTED",
        },
      },
    });

    if (payment.payerTenant) {
      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [payment.payerTenant],
        type: "GENERAL",
        title: "Payment reversed",
        message: `A previously verified payment was reversed: ${reason}`,
      });
    }
  });

  revalidatePaymentSurfaces();
  redirect(paymentsMessageUrl("Payment reversed and allocations corrected."));
}
