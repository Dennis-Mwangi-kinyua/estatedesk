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
import { writeAuditLog } from "@/lib/audit/security";
import { prisma } from "@/lib/prisma";
import { parseBankStatement } from "@/lib/payments/bank-statement";

export async function importBankStatementAction(formData: FormData) {
  const session = await requirePaymentManager();
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
  const session = await requirePaymentManager();
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
  const session = await requirePaymentManager();
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
