"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAuditLog } from "@/lib/audit/security";
import { postVerifiedPayment, reversePaymentPosting } from "@/lib/accounting/payments";
import { issueDocumentRecord } from "@/lib/documents/registry";
import { createReceiptSnapshot } from "@/lib/documents/receipt-snapshot";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { allocateRentPayment, getCurrentPeriod } from "@/lib/ledger";
import { notifyRecipients } from "@/lib/notifications/notify";
import { parseBankStatement } from "@/lib/payments/bank-statement";
import { chargeAfterPaymentReversal } from "@/lib/payments/lifecycle";

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

export async function reverseVerifiedPaymentAction(formData: FormData) {
  const session = await requirePaymentReviewer();
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
        waterBill: { select: { id: true } },
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
      await tx.waterBill.update({
        where: { id: payment.waterBill.id },
        data: { status: "ISSUED" },
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

export async function importBankStatementAction(formData: FormData) {
  const session = await requirePaymentReviewer();
  const file = formData.get("statement");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a bank statement CSV file.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Bank statement CSV must be 2 MB or smaller.");
  }

  const rows = parseBankStatement(await file.text());
  let matched = 0;
  let unmatched = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const payment = await tx.payment.findFirst({
        where: {
          orgId: session.activeOrgId!,
          method: "BANK",
          externalReference: { equals: row.transactionId, mode: "insensitive" },
          amount: new Prisma.Decimal(row.amount),
          verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
        },
        select: { id: true, reconciliationStatus: true },
      });
      if (!payment) {
        unmatched += 1;
        continue;
      }

      if (payment.reconciliationStatus !== "RECONCILED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            reconciliationStatus: "RECONCILED",
            reconciledAt: new Date(),
            reconciledByUserId: session.userId,
            reconciliationNotes: `Matched by bank statement import, line ${row.line}.`,
          },
        });
        await tx.auditLog.create({
          data: {
            orgId: session.activeOrgId!,
            actorUserId: session.userId,
            action: "PAYMENT_RECONCILED_BY_BANK_IMPORT",
            entityType: "Payment",
            entityId: payment.id,
            metadata: {
              line: row.line,
              transactionId: row.transactionId,
              amount: row.amount,
              paidAt: row.paidAt.toISOString(),
              payerName: row.payerName,
            },
          },
        });
      }
      matched += 1;
    }
  });

  revalidatePaymentSurfaces();
  redirect(
    paymentsMessageUrl(
      `Bank statement processed: ${matched} matched, ${unmatched} unmatched.`,
    ),
  );
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
