"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit/security";
import { issueDocumentRecord } from "@/lib/documents/registry";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { allocateRentPayment, getCurrentPeriod } from "@/lib/ledger";
import { notifyRecipients } from "@/lib/notifications/notify";

const PAYMENTS_PATH = "/dashboard/org/payments";

function paymentsMessageUrl(
  message: string,
  messageType: "success" | "error" = "success",
) {
  const params = new URLSearchParams({ message, messageType });
  return `${PAYMENTS_PATH}?${params.toString()}`;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function asObject(
  value: Prisma.JsonValue | null | undefined,
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

function getString(source: Record<string, Prisma.JsonValue>, key: string) {
  return typeof source[key] === "string" ? source[key] : "";
}

function getNumber(source: Record<string, Prisma.JsonValue>, key: string) {
  return typeof source[key] === "number" ? source[key] : undefined;
}

async function requirePaymentReviewer() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  return session;
}

function revalidatePaymentSurfaces() {
  revalidatePath(PAYMENTS_PATH);
  revalidatePath("/dashboard/org/charges");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/tenant/water-bills");
}

export async function verifyTenantPaymentAction(formData: FormData) {
  const session = await requirePaymentReviewer();
  const paymentId = readString(formData, "paymentId");

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
          ? `${payment.notes} Verified by organization.`
          : "Verified by organization.",
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
  });

  revalidatePaymentSurfaces();
  redirect(paymentsMessageUrl("Payment verified successfully."));
}

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
  });

  revalidatePaymentSurfaces();
  redirect(paymentsMessageUrl("Payment rejected successfully."));
}

export async function reconcilePaymentAction(formData: FormData) {
  const session = await requirePaymentReviewer();
  const paymentId = readString(formData, "paymentId");
  const notes = readString(formData, "notes");

  if (!paymentId) {
    throw new Error("Payment id is required.");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      orgId: session.activeOrgId!,
    },
    select: {
      id: true,
      verificationStatus: true,
      reconciliationStatus: true,
      amount: true,
      reference: true,
      externalReference: true,
      checkoutRequestId: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found.");
  }

  if (
    payment.verificationStatus !== "VERIFIED" &&
    payment.verificationStatus !== "NOT_REQUIRED"
  ) {
    throw new Error("Only verified payments can be reconciled.");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      reconciliationStatus: "RECONCILED",
      reconciledAt: new Date(),
      reconciledByUserId: session.userId,
      reconciliationNotes: notes || "Matched against source statement.",
    },
  });

  await writeAuditLog({
    orgId: session.activeOrgId!,
    actorUserId: session.userId,
    action: "PAYMENT_RECONCILED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      amount: Number(payment.amount),
      reference:
        payment.externalReference ?? payment.reference ?? payment.checkoutRequestId,
      previousStatus: payment.reconciliationStatus,
    },
  });

  revalidatePaymentSurfaces();
  redirect(paymentsMessageUrl("Payment reconciled successfully."));
}

export async function disputePaymentReconciliationAction(formData: FormData) {
  const session = await requirePaymentReviewer();
  const paymentId = readString(formData, "paymentId");
  const notes = readString(formData, "notes");

  if (!paymentId) {
    throw new Error("Payment id is required.");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      orgId: session.activeOrgId!,
    },
    select: {
      id: true,
      reconciliationStatus: true,
      amount: true,
      reference: true,
      externalReference: true,
      checkoutRequestId: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found.");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      reconciliationStatus: "DISPUTED",
      reconciledAt: null,
      reconciledByUserId: null,
      reconciliationNotes:
        notes || "Flagged for reconciliation review by finance.",
    },
  });

  await writeAuditLog({
    orgId: session.activeOrgId!,
    actorUserId: session.userId,
    action: "PAYMENT_RECONCILIATION_DISPUTED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      amount: Number(payment.amount),
      reference:
        payment.externalReference ?? payment.reference ?? payment.checkoutRequestId,
      previousStatus: payment.reconciliationStatus,
      notes: notes || null,
    },
  });

  revalidatePaymentSurfaces();
  redirect(paymentsMessageUrl("Payment flagged for reconciliation review."));
}
