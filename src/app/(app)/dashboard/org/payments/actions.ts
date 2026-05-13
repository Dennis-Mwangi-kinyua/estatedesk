"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { allocateRentPayment, getCurrentPeriod } from "@/lib/ledger";
import { notifyRecipients } from "@/lib/notifications/notify";

const PAYMENTS_PATH = "/dashboard/org/payments";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formatReceiptNo(paymentId: string) {
  return `RCT-${new Date().getFullYear()}-${paymentId.slice(-8).toUpperCase()}`;
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
        paidAt: payment.paidAt ?? now,
        notes: payment.notes
          ? `${payment.notes} Verified by organization.`
          : "Verified by organization.",
      },
    });

    if (!payment.receipt) {
      await tx.receipt.create({
        data: {
          paymentId: payment.id,
          receiptNo: formatReceiptNo(payment.id),
        },
      });
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
        }).format(Number(payment.amount))} has been verified. Receipt ${formatReceiptNo(payment.id)} is available in EstateDesk.`,
      });
    }
  });

  revalidatePaymentSurfaces();
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
}
