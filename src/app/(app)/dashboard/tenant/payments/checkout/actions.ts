"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { notifyRecipients } from "@/lib/notifications/notify";
import { getCurrentPeriod } from "@/lib/ledger";
import { parsePaymentInstructions } from "@/lib/payments/instructions";
import {
  buildBankTransactionKey,
  buildMpesaTransactionKey,
  isUniqueConstraintError,
  normalizeTransactionReference,
} from "@/lib/payments/transaction-reference";
import { isPayableWaterBillStatus } from "@/lib/water-bills/status";

type StartPaymentInput = {
  source: string;
  id: string;
  method: string;
  phoneNumber?: string;
  accountName?: string;
  transactionId?: string;
  amount?: number;
  months?: number;
};

export type TenantPaymentCheckoutSummary = {
  friendlyReference: string;
  description: string;
  propertyName: string;
  unitLabel: string;
  amount: number | null;
};

export async function getTenantPaymentInstructions() {
  const session = await requireTenantAccess();

  if (!session.activeOrgId) {
    throw new Error("Missing tenant session context.");
  }

  const settings = await prisma.organizationSettings.findUnique({
    where: { orgId: session.activeOrgId },
    select: {
      customFields: true,
    },
  });

  return parsePaymentInstructions(settings?.customFields);
}

function normalizeReferencePart(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
}

function buildPaymentReference({
  source,
  period,
  unitLabel,
}: {
  source: string;
  period: string;
  unitLabel: string;
}) {
  const prefix = getReferencePrefix(source);
  const unit = normalizeReferencePart(unitLabel) || "UNIT";
  return `${prefix}-${period}-${unit}`;
}

export async function getTenantPaymentCheckoutSummary({
  source,
  id,
}: {
  source: string | null;
  id: string | null;
}): Promise<TenantPaymentCheckoutSummary | null> {
  if (!source || !id) return null;

  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    throw new Error("Missing tenant session context.");
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant profile not found.");
  }

  if (source === "rent_charge") {
    const charge = await prisma.rentCharge.findFirst({
      where: {
        id,
        orgId: session.activeOrgId,
        lease: {
          tenantId: tenant.id,
          deletedAt: null,
        },
      },
      select: {
        period: true,
        chargeType: true,
        balance: true,
        amountDue: true,
        lease: {
          select: {
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

    if (!charge) return null;

    const unitLabel = charge.lease.unit.houseNo;
    return {
      friendlyReference: buildPaymentReference({
        source,
        period: charge.period,
        unitLabel,
      }),
      description: `${charge.chargeType.toLowerCase().replaceAll("_", " ")} for ${charge.period}`,
      propertyName: charge.lease.unit.property.name,
      unitLabel,
      amount: Number(charge.balance ?? charge.amountDue),
    };
  }

  if (source === "advance_rent") {
    const lease = await prisma.lease.findFirst({
      where: {
        id,
        orgId: session.activeOrgId,
        tenantId: tenant.id,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
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

    if (!lease) return null;

    const unitLabel = lease.unit.houseNo;
    return {
      friendlyReference: buildPaymentReference({
        source,
        period: getCurrentPeriod(),
        unitLabel,
      }),
      description: `Advance rent from ${getCurrentPeriod()}`,
      propertyName: lease.unit.property.name,
      unitLabel,
      amount: null,
    };
  }

  if (source === "water_bill") {
    const bill = await prisma.waterBill.findFirst({
      where: {
        id,
        orgId: session.activeOrgId,
        tenantId: tenant.id,
      },
      select: {
        period: true,
        total: true,
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

    if (!bill) return null;

    const unitLabel = bill.unit.houseNo;
    return {
      friendlyReference: buildPaymentReference({
        source,
        period: bill.period,
        unitLabel,
      }),
      description: `Water bill for ${bill.period}`,
      propertyName: bill.unit.property.name,
      unitLabel,
      amount: Number(bill.total),
    };
  }

  return null;
}

function mapPaymentMethod(method: string) {
  if (method === "mpesa") return "MPESA_MANUAL" as const;
  if (method === "cash") return "CASH" as const;
  return "BANK" as const;
}

function getReferencePrefix(source: string) {
  if (source === "water_bill") return "WB";
  if (source === "rent_charge") return "RC";
  if (source === "advance_rent") return "AR";
  return "PMT";
}

async function getPaymentReviewRecipients(
  tx: Prisma.TransactionClient,
  orgId: string,
) {
  const memberships = await tx.membership.findMany({
    where: {
      orgId,
      role: {
        in: ["ADMIN", "MANAGER", "ACCOUNTANT"],
      },
      user: {
        deletedAt: null,
        status: "ACTIVE",
      },
    },
    select: {
      userId: true,
    },
  });

  return memberships.map((membership) => ({ userId: membership.userId }));
}

export async function startTenantPayment(input: StartPaymentInput) {
  const { source, id, method, phoneNumber, accountName } = input;

  if (!source || !id || !method) {
    throw new Error("Missing source, id, or method");
  }

  const params = new URLSearchParams({
    source,
    id,
    method,
  });

  if (phoneNumber) {
    params.set("phoneNumber", phoneNumber);
  }

  if (accountName) {
    params.set("accountName", accountName);
  }

  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    throw new Error("Missing tenant session context.");
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      userId: true,
    },
  });

  if (!tenant) {
    throw new Error("Tenant profile not found.");
  }

  const paymentMethod = mapPaymentMethod(method);
  const paidAt = new Date();
  const transactionId = normalizeTransactionReference(input.transactionId ?? "");

  const isBankPayment = method !== "mpesa" && method !== "airtel-money";

  if ((method === "mpesa" || isBankPayment) && !transactionId) {
    throw new Error("Transaction ID is required for manual M-Pesa and bank payments.");
  }

  if (method === "mpesa" && !/^[A-Z0-9]{10}$/.test(transactionId)) {
    throw new Error("Enter the 10-character M-Pesa transaction code.");
  }

  if (isBankPayment && (transactionId.length < 4 || transactionId.length > 100)) {
    throw new Error("Enter a valid bank transaction ID.");
  }

  const settings = await prisma.organizationSettings.findUnique({
    where: { orgId: session.activeOrgId },
    select: { customFields: true },
  });
  const instructions = parsePaymentInstructions(settings?.customFields);
  const transactionReferenceKey =
    method === "mpesa"
      ? buildMpesaTransactionKey(transactionId)
      : isBankPayment
        ? buildBankTransactionKey({
            bankName: method || instructions.bankName,
            accountNumber: instructions.bankAccountNumber,
            reference: transactionId,
          })
        : null;

  try {
    await prisma.$transaction(async (tx) => {
    if (source === "rent_charge") {
      const charge = await tx.rentCharge.findFirst({
        where: {
          id,
          orgId: session.activeOrgId!,
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
          orgId: session.activeOrgId!,
          payerTenantId: tenant.id,
          payerUserId: session.userId,
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
            sourceId: id,
            submittedAt: paidAt.toISOString(),
          },
        },
        select: { id: true },
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id, userId: session.userId }],
        type: "GENERAL",
        title: "Payment submitted",
        message: `Your ${charge.chargeType.toLowerCase().replaceAll("_", " ")} payment for ${charge.period} has been submitted and is awaiting verification.`,
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: await getPaymentReviewRecipients(tx, session.activeOrgId!),
        channels: ["IN_APP"],
        type: "GENERAL",
        title: "Payment needs verification",
        message: `${tenant.fullName} submitted ${charge.period} payment for ${charge.lease.unit.property.name} / Unit ${charge.lease.unit.houseNo}.`,
      });

      return;
    }

    if (source === "advance_rent") {
      const months = Math.min(Math.max(Number(input.months ?? 1), 1), 36);
      const amount = Number(input.amount ?? 0);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Advance rent amount must be greater than zero.");
      }

      const lease = await tx.lease.findFirst({
        where: {
          id,
          orgId: session.activeOrgId!,
          tenantId: tenant.id,
          status: "ACTIVE",
          deletedAt: null,
        },
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
      });

      if (!lease) {
        throw new Error("Active lease not found.");
      }

      await tx.payment.create({
        data: {
          orgId: session.activeOrgId!,
          payerTenantId: tenant.id,
          payerUserId: session.userId,
          payerType: "TENANT",
          payerName: tenant.fullName,
          method: paymentMethod,
          amount,
          targetType: "RENT",
          gatewayStatus: "PENDING",
          verificationStatus: "PENDING",
          phoneUsed: phoneNumber || null,
          reference: buildPaymentReference({
            source,
            period: getCurrentPeriod(),
            unitLabel: lease.unit.houseNo,
          }),
          externalReference: transactionId || null,
          transactionReferenceKey,
          paidAt: null,
          notes: `Tenant submitted advance rent for up to ${months} month${months === 1 ? "" : "s"} awaiting organization verification.`,
          callbackRaw: {
            source,
            accountName: accountName || null,
            sourceId: id,
            leaseId: lease.id,
            months,
            startPeriod: getCurrentPeriod(),
            submittedAt: paidAt.toISOString(),
          },
        },
        select: { id: true },
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id, userId: session.userId }],
        type: "GENERAL",
        title: "Advance rent submitted",
        message: `Your advance rent payment has been submitted and is awaiting verification.`,
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: await getPaymentReviewRecipients(tx, session.activeOrgId!),
        channels: ["IN_APP"],
        type: "GENERAL",
        title: "Advance rent needs verification",
        message: `${tenant.fullName} submitted advance rent for ${lease.unit.property.name} / Unit ${lease.unit.houseNo}.`,
      });

      return;
    }

    if (source === "water_bill") {
      const bill = await tx.waterBill.findFirst({
        where: {
          id,
          orgId: session.activeOrgId!,
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
          orgId: session.activeOrgId!,
          payerTenantId: tenant.id,
          payerUserId: session.userId,
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
            sourceId: id,
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
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id, userId: session.userId }],
        type: "GENERAL",
        title: "Water payment submitted",
        message: `Your water bill payment for ${bill.period} has been submitted and is awaiting verification.`,
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: await getPaymentReviewRecipients(tx, session.activeOrgId!),
        channels: ["IN_APP"],
        type: "GENERAL",
        title: "Water payment needs verification",
        message: `${tenant.fullName} submitted water bill ${bill.period} for ${bill.unit.property.name} / Unit ${bill.unit.houseNo}.`,
      });

      return;
    }

    throw new Error("Unsupported payment source.");
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("That transaction ID has already been submitted.");
    }
    throw error;
  }

  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/tenant/water-bills");
  revalidatePath("/dashboard/org/payments");
  revalidatePath("/dashboard/org/charges");
  revalidatePath("/dashboard/org/notifications");

  redirect(`/dashboard/tenant/payments?${params.toString()}&status=pending`);
}
