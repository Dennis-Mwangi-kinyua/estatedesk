import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";
import {
  allocateCombinedPeriodPayment,
  allocateRentPayment,
  getCurrentPeriod,
} from "@/lib/ledger";
import { postVerifiedPayment } from "@/lib/accounting/payments";
import { issueDocumentRecord } from "@/lib/documents/registry";
import { createReceiptSnapshot } from "@/lib/documents/receipt-snapshot";
import { notifyRecipients } from "@/lib/notifications/notify";

type Db = PrismaClient | Prisma.TransactionClient;

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getString(source: Record<string, unknown>, key: string) {
  return typeof source[key] === "string" ? source[key] : "";
}

function getNumber(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * After a gateway (e.g. M-Pesa STK) confirms payment, mark it verified and
 * reduce rent + water balances immediately — no org manual review.
 */
export async function settleGatewayPayment({
  db,
  paymentId,
  actorUserId,
}: {
  db: Db;
  paymentId: string;
  actorUserId?: string | null;
}) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
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
          total: true,
          amountPaid: true,
          balance: true,
          status: true,
        },
      },
      receipt: {
        select: { id: true, receiptNo: true, documentId: true },
      },
      payerTenant: {
        select: { id: true, fullName: true, userId: true },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found for gateway settlement.");
  }

  if (payment.verificationStatus === "VERIFIED") {
    return { alreadySettled: true as const, paymentId };
  }

  if (payment.gatewayStatus === "FAILED" || payment.gatewayStatus === "CANCELLED") {
    throw new Error("Cannot settle a failed payment.");
  }

  const metadata = asObject(payment.callbackRaw);
  const now = new Date();

  await db.payment.update({
    where: { id: payment.id },
    data: {
      gatewayStatus: "SUCCESS",
      verificationStatus: "VERIFIED",
      reconciliationStatus: "UNRECONCILED",
      paidAt: payment.paidAt ?? now,
      notes: payment.notes
        ? `${payment.notes} Auto-settled by payment gateway.`
        : "Auto-settled by payment gateway.",
    },
  });

  let receiptNumber = payment.receipt?.receiptNo ?? "";

  if (!payment.receipt?.documentId) {
    const document = await issueDocumentRecord({
      db,
      orgId: payment.orgId,
      documentType: "RECEIPT",
      entityType: "Payment",
      entityId: payment.id,
      title: "Payment receipt",
      issuedByUserId: actorUserId ?? payment.payerUserId,
      issuedAt: now,
      preferredSerialNumber: payment.receipt?.receiptNo,
      metadata: {
        paymentId: payment.id,
        targetType: payment.targetType,
        settlement: "gateway",
      },
    });
    receiptNumber = document.serialNumber;

    if (payment.receipt) {
      await db.receipt.update({
        where: { id: payment.receipt.id },
        data: { documentId: document.id },
      });
    } else {
      await db.receipt.create({
        data: {
          paymentId: payment.id,
          documentId: document.id,
          receiptNo: document.serialNumber,
        },
      });
    }
  }

  const isCombined =
    payment.targetType === "COMBINED" ||
    metadata.combined === true ||
    metadata.source === "period_bill";

  if (isCombined) {
    const leaseId =
      getString(metadata, "leaseId") || payment.rentCharge?.leaseId || null;
    const period =
      getString(metadata, "period") ||
      payment.rentCharge?.period ||
      payment.waterBill?.period ||
      getCurrentPeriod();

    if (leaseId) {
      await allocateCombinedPeriodPayment({
        db,
        orgId: payment.orgId,
        paymentId: payment.id,
        leaseId,
        period,
        amount: payment.amount,
        waterBillId:
          payment.waterBill?.id ??
          (getString(metadata, "waterBillId") || null),
      });
    }
  } else if (payment.rentCharge) {
    const balance = new Prisma.Decimal(payment.rentCharge.balance);
    const paymentAmount = new Prisma.Decimal(payment.amount);
    const allocationAmount = paymentAmount.gt(balance) ? balance : paymentAmount;
    const nextPaid = new Prisma.Decimal(payment.rentCharge.amountPaid).add(
      allocationAmount,
    );
    const nextBalance = balance.sub(allocationAmount);

    await db.paymentAllocation.upsert({
      where: {
        paymentId_rentChargeId: {
          paymentId: payment.id,
          rentChargeId: payment.rentCharge.id,
        },
      },
      update: { amount: { increment: allocationAmount } },
      create: {
        orgId: payment.orgId,
        paymentId: payment.id,
        rentChargeId: payment.rentCharge.id,
        period: payment.rentCharge.period,
        amount: allocationAmount,
      },
    });

    await db.rentCharge.update({
      where: { id: payment.rentCharge.id },
      data: {
        amountPaid: nextPaid,
        balance: nextBalance,
        status: nextBalance.lte(0) ? "PAID" : "PARTIAL",
      },
    });

    let remainder = paymentAmount.sub(allocationAmount);
    if (remainder.gt(0) && payment.waterBill) {
      const waterBalance = new Prisma.Decimal(
        payment.waterBill.balance != null && Number(payment.waterBill.balance) > 0
          ? payment.waterBill.balance
          : payment.waterBill.total,
      );
      if (waterBalance.gt(0)) {
        const waterApply = remainder.lt(waterBalance) ? remainder : waterBalance;
        const nextWaterPaid = new Prisma.Decimal(
          payment.waterBill.amountPaid ?? 0,
        ).add(waterApply);
        const nextWaterBalance = waterBalance.sub(waterApply);
        await db.waterBill.update({
          where: { id: payment.waterBill.id },
          data: {
            amountPaid: nextWaterPaid,
            balance: nextWaterBalance.lt(0) ? new Prisma.Decimal(0) : nextWaterBalance,
            status: nextWaterBalance.lte(0) ? "PAID_VERIFIED" : "ISSUED",
          },
        });
        remainder = remainder.sub(waterApply);
      }
    }

    await db.payment.update({
      where: { id: payment.id },
      data: {
        unappliedAmount: remainder,
        coveredPeriods: [payment.rentCharge.period],
      },
    });
  } else if (payment.targetType === "RENT") {
    const leaseId = getString(metadata, "leaseId");
    const months = getNumber(metadata, "months") ?? 1;
    const startPeriod =
      getString(metadata, "startPeriod") || getCurrentPeriod();
    if (leaseId) {
      await allocateRentPayment({
        db,
        orgId: payment.orgId,
        paymentId: payment.id,
        leaseId,
        amount: payment.amount,
        startPeriod,
        months,
      });
    }
  } else if (payment.waterBill) {
    const waterBalance = new Prisma.Decimal(
      payment.waterBill.balance != null && Number(payment.waterBill.balance) > 0
        ? payment.waterBill.balance
        : payment.waterBill.total,
    );
    const paymentAmount = new Prisma.Decimal(payment.amount);
    const apply = paymentAmount.gt(waterBalance) ? waterBalance : paymentAmount;
    const nextPaid = new Prisma.Decimal(payment.waterBill.amountPaid ?? 0).add(
      apply,
    );
    const nextBalance = waterBalance.sub(apply);

    await db.waterBill.update({
      where: { id: payment.waterBill.id },
      data: {
        amountPaid: nextPaid,
        balance: nextBalance.lt(0) ? new Prisma.Decimal(0) : nextBalance,
        status: nextBalance.lte(0) ? "PAID_VERIFIED" : "ISSUED",
      },
    });

    await db.payment.update({
      where: { id: payment.id },
      data: {
        unappliedAmount: paymentAmount.sub(apply),
        coveredPeriods: [payment.waterBill.period],
      },
    });
  }

  if (payment.receipt?.documentId || receiptNumber) {
    try {
      const snapshot = await createReceiptSnapshot(
        db,
        payment.id,
        actorUserId ?? payment.payerUserId,
      );

      let etimsSubmission: Prisma.InputJsonValue | undefined;
      try {
        const { submitEtimsSalesReceipt } = await import("@/lib/tax/etims-client");
        const { getEtimsClientConfigForOrg } = await import(
          "@/lib/tax/org-etims-config"
        );
        const orgConfig = await getEtimsClientConfigForOrg(payment.orgId);
        // Temporarily apply org secrets for this submit (process-local).
        const prev = {
          id: process.env.KRA_ETIMS_CLIENT_ID,
          secret: process.env.KRA_ETIMS_CLIENT_SECRET,
          base: process.env.KRA_ETIMS_BASE_URL,
          env: process.env.KRA_ETIMS_ENVIRONMENT,
          cu: process.env.KRA_ETIMS_CU_SERIAL,
        };
        if (orgConfig.clientId) process.env.KRA_ETIMS_CLIENT_ID = orgConfig.clientId;
        if (orgConfig.clientSecret) {
          process.env.KRA_ETIMS_CLIENT_SECRET = orgConfig.clientSecret;
        }
        if (orgConfig.baseUrl) process.env.KRA_ETIMS_BASE_URL = orgConfig.baseUrl;
        if (orgConfig.environment !== "unconfigured") {
          process.env.KRA_ETIMS_ENVIRONMENT = orgConfig.environment;
        }
        if (orgConfig.controlUnitSerial) {
          process.env.KRA_ETIMS_CU_SERIAL = orgConfig.controlUnitSerial;
        }

        const etimsResult = await submitEtimsSalesReceipt({
          serialNumber:
            receiptNumber ||
            snapshot.paymentReference ||
            payment.id,
          organizationKraPin: snapshot.kraPin,
          tenantKraPin: snapshot.tenantKraPin,
          amount: snapshot.amount,
          currencyCode: snapshot.currencyCode,
          paymentFor: snapshot.paymentFor,
          allocations: snapshot.allocations,
          controlUnitSerial:
            orgConfig.controlUnitSerial || snapshot.etimsControlUnitSerial,
          issuedAt: new Date(snapshot.paidAt),
        });

        if (prev.id === undefined) delete process.env.KRA_ETIMS_CLIENT_ID;
        else process.env.KRA_ETIMS_CLIENT_ID = prev.id;
        if (prev.secret === undefined) delete process.env.KRA_ETIMS_CLIENT_SECRET;
        else process.env.KRA_ETIMS_CLIENT_SECRET = prev.secret;
        if (prev.base === undefined) delete process.env.KRA_ETIMS_BASE_URL;
        else process.env.KRA_ETIMS_BASE_URL = prev.base;
        if (prev.env === undefined) delete process.env.KRA_ETIMS_ENVIRONMENT;
        else process.env.KRA_ETIMS_ENVIRONMENT = prev.env;
        if (prev.cu === undefined) delete process.env.KRA_ETIMS_CU_SERIAL;
        else process.env.KRA_ETIMS_CU_SERIAL = prev.cu;

        etimsSubmission = {
          ok: etimsResult.ok,
          mode: etimsResult.mode,
          environment: etimsResult.environment,
          source: orgConfig.source,
          message: etimsResult.message,
          kraReceiptNo: etimsResult.kraReceiptNo ?? null,
          submittedAt: new Date().toISOString(),
        };
      } catch {
        etimsSubmission = {
          ok: false,
          mode: "skipped",
          message: "eTIMS submit threw; receipt snapshot still saved",
        };
      }

      await db.documentRecord.update({
        where: payment.receipt?.documentId
          ? { id: payment.receipt.documentId }
          : { serialNumber: receiptNumber },
        data: {
          metadata: {
            paymentId: payment.id,
            targetType: payment.targetType,
            receiptSnapshot: snapshot as unknown as Prisma.InputJsonValue,
            ...(etimsSubmission ? { etimsSubmission } : {}),
            settlement: "gateway",
          },
        },
      });
    } catch {
      // Snapshot is best-effort for gateway auto-settle.
    }
  }

  try {
    await postVerifiedPayment(db, payment.id, actorUserId);
  } catch {
    // Accounting may not be initialized.
  }

  if (payment.payerTenant) {
    await notifyRecipients({
      db,
      orgId: payment.orgId,
      recipients: [
        {
          tenantId: payment.payerTenant.id,
          userId: payment.payerTenant.userId,
        },
      ],
      type: "PAYMENT_VERIFIED",
      title: "Payment received",
      message: `Your payment of ${new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0,
      }).format(Number(payment.amount))} was confirmed and applied to your bill${
        receiptNumber ? `. Receipt ${receiptNumber}` : ""
      }.`,
    });
  }

  return { alreadySettled: false as const, paymentId, receiptNumber };
}
