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
import { postVerifiedPayment } from "@/lib/accounting/payments";
import { issueDocumentRecord } from "@/lib/documents/registry";
import { createReceiptSnapshot } from "@/lib/documents/receipt-snapshot";
import { prisma } from "@/lib/prisma";
import { allocateRentPayment, getCurrentPeriod } from "@/lib/ledger";
import { notifyRecipients } from "@/lib/notifications/notify";

export async function verifyTenantPaymentAction(formData: FormData) {
  const session = await requirePaymentReviewer();
  const paymentId = readString(formData, "paymentId");
  const verificationNote = readString(formData, "verificationNote");

  if (!paymentId) {
    throw new Error("Payment id is required.");
  }
  if (verificationNote.length < 5) {
    throw new Error("Record how the payment evidence was verified.");
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        id: paymentId,
        orgId: session.activeOrgId!,
      },
      include: {
        rentCharge: {
          select: {
            id: true,
            period: true,
            leaseId: true,
            amountPaid: true,
            balance: true,
          },
        },
        waterBill: {
          select: {
            id: true,
            period: true,
          },
        },
        receipt: {
          select: {
            id: true,
            receiptNo: true,
            documentId: true,
          },
        },
        payerTenant: {
          select: {
            id: true,
            fullName: true,
            userId: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found.");
    }

    if (payment.verificationStatus === "VERIFIED") {
      return;
    }

    if (payment.verificationStatus === "REJECTED") {
      throw new Error("Rejected payments cannot be verified.");
    }

    const metadata = asObject(payment.callbackRaw);
    const now = new Date();

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        gatewayStatus: "SUCCESS",
        verificationStatus: "VERIFIED",
        reconciliationStatus: "UNRECONCILED",
        paidAt: payment.paidAt ?? now,
        notes: payment.notes
          ? `${payment.notes} Verified by organization: ${verificationNote}`
          : `Verified by organization: ${verificationNote}`,
      },
    });

    let receiptNumber = payment.receipt?.receiptNo ?? "";

    if (!payment.receipt?.documentId) {
      const document = await issueDocumentRecord({
        db: tx,
        orgId: session.activeOrgId!,
        documentType: "RECEIPT",
        entityType: "Payment",
        entityId: payment.id,
        title: "Verified payment receipt",
        issuedByUserId: session.userId,
        issuedAt: now,
        preferredSerialNumber: payment.receipt?.receiptNo,
        metadata: {
          paymentId: payment.id,
          targetType: payment.targetType,
        },
      });
      receiptNumber = document.serialNumber;

      if (payment.receipt) {
        await tx.receipt.update({
          where: { id: payment.receipt.id },
          data: { documentId: document.id },
        });
      } else {
        await tx.receipt.create({
          data: {
            paymentId: payment.id,
            documentId: document.id,
            receiptNo: document.serialNumber,
          },
        });
      }
    } else if (!receiptNumber) {
      throw new Error("Receipt identity is incomplete.");
    }

    if (payment.rentCharge) {
      const balance = new Prisma.Decimal(payment.rentCharge.balance);
      const paymentAmount = new Prisma.Decimal(payment.amount);
      const allocationAmount = paymentAmount.gt(balance) ? balance : paymentAmount;
      const nextPaid = new Prisma.Decimal(payment.rentCharge.amountPaid).add(
        allocationAmount,
      );
      const nextBalance = balance.sub(allocationAmount);

      await tx.paymentAllocation.upsert({
        where: {
          paymentId_rentChargeId: {
            paymentId: payment.id,
            rentChargeId: payment.rentCharge.id,
          },
        },
        update: {
          amount: {
            increment: allocationAmount,
          },
        },
        create: {
          orgId: session.activeOrgId!,
          paymentId: payment.id,
          rentChargeId: payment.rentCharge.id,
          period: payment.rentCharge.period,
          amount: allocationAmount,
        },
      });

      await tx.rentCharge.update({
        where: { id: payment.rentCharge.id },
        data: {
          amountPaid: nextPaid,
          balance: nextBalance,
          status: nextBalance.lte(0) ? "PAID" : "PARTIAL",
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          unappliedAmount: paymentAmount.sub(allocationAmount),
          coveredPeriods: [payment.rentCharge.period],
        },
      });
    } else if (payment.targetType === "RENT") {
      const leaseId = getString(metadata, "leaseId");
      const months = getNumber(metadata, "months") ?? 1;
      const startPeriod = getString(metadata, "startPeriod") || getCurrentPeriod();

      if (!leaseId) {
        throw new Error("This rent payment is missing lease metadata.");
      }

      await allocateRentPayment({
        db: tx,
        orgId: session.activeOrgId!,
        paymentId: payment.id,
        leaseId,
        amount: payment.amount,
        startPeriod,
        months,
      });
    }

    if (payment.waterBill) {
      await tx.waterBill.update({
        where: { id: payment.waterBill.id },
        data: {
          status: "PAID_VERIFIED",
        },
      });
    }

    if (payment.receipt?.documentId || receiptNumber) {
      const snapshot = await createReceiptSnapshot(tx, payment.id, session.userId);
      await tx.documentRecord.update({
        where: payment.receipt?.documentId
          ? { id: payment.receipt.documentId }
          : { serialNumber: receiptNumber },
        data: {
          metadata: {
            paymentId: payment.id,
            targetType: payment.targetType,
            receiptSnapshot: snapshot,
          },
        },
      });
    }

    await postVerifiedPayment(tx, payment.id, session.userId);

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
        type: "PAYMENT_VERIFIED",
        title: "Payment verified",
        message: `Your payment of ${new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          maximumFractionDigits: 0,
        }).format(Number(payment.amount))} has been verified. Receipt ${receiptNumber} is available in EstateDesk.`,
      });
    }

    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "PAYMENT_VERIFIED",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          amount: Number(payment.amount),
          method: payment.method,
          reference:
            payment.externalReference ?? payment.reference ?? payment.checkoutRequestId,
          receiptNumber,
          verificationNote,
        },
        beforeState: { verificationStatus: payment.verificationStatus },
        afterState: {
          verificationStatus: "VERIFIED",
          reconciliationStatus: "UNRECONCILED",
        },
      },
    });
  });

  revalidatePaymentSurfaces();
  redirect(paymentsMessageUrl("Payment verified successfully."));
}
