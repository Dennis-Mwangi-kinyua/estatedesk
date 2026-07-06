"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  asObject,
  getNumber,
  getString,
  paymentsMessageUrl,
  readString,
  requirePaymentReviewer,
  revalidatePaymentSurfaces,
} from "./payment-action-shared";
import { prisma } from "@/lib/prisma";
import { notifyRecipients } from "@/lib/notifications/notify";

export async function rejectTenantPaymentAction(formData: FormData) {
  const session = await requirePaymentReviewer();
  const paymentId = readString(formData, "paymentId");
  const reason = readString(formData, "reason");

  if (!paymentId) {
    throw new Error("Payment id is required.");
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        id: paymentId,
        orgId: session.activeOrgId!,
      },
      include: {
        waterBill: {
          select: {
            id: true,
          },
        },
        payerTenant: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found.");
    }

    if (payment.verificationStatus === "VERIFIED") {
      throw new Error("Verified payments cannot be rejected.");
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        gatewayStatus: "CANCELLED",
        verificationStatus: "REJECTED",
        reconciliationStatus: "DISPUTED",
        reconciliationNotes: reason || "Rejected by organization.",
        notes: reason
          ? `${payment.notes ?? ""} Rejected: ${reason}`.trim()
          : `${payment.notes ?? ""} Rejected by organization.`.trim(),
      },
    });

    if (payment.waterBill) {
      await tx.waterBill.update({
        where: { id: payment.waterBill.id },
        data: {
          status: "ISSUED",
        },
      });
    }

    if (payment.payerTenant) {
      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [
          {
            tenantId: payment.payerTenant.id,
            userId: payment.payerTenant.userId,
          },
        ],
        type: "GENERAL",
        title: "Payment rejected",
        message: reason
          ? `Your submitted payment was rejected: ${reason}`
          : "Your submitted payment was rejected. Please contact your property manager.",
      });
    }

    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "PAYMENT_REJECTED",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          amount: Number(payment.amount),
          method: payment.method,
          reference:
            payment.externalReference ?? payment.reference ?? payment.checkoutRequestId,
          reason: reason || "Rejected by organization.",
        },
        beforeState: { verificationStatus: payment.verificationStatus },
        afterState: {
          verificationStatus: "REJECTED",
          reconciliationStatus: "DISPUTED",
        },
      },
    });
  });

  revalidatePaymentSurfaces();
  redirect(paymentsMessageUrl("Payment rejected successfully."));
}
