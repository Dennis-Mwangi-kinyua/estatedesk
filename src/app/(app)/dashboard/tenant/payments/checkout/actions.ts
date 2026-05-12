"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { notifyRecipients } from "@/lib/notifications/notify";
import { allocateRentPayment, getCurrentPeriod } from "@/lib/ledger";

type StartPaymentInput = {
  source: string;
  id: string;
  method: string;
  phoneNumber?: string;
  accountName?: string;
  amount?: number;
  months?: number;
};

function mapPaymentMethod(method: string) {
  if (method === "mpesa") return "MPESA_STK" as const;
  if (method === "cash") return "CASH" as const;
  return "BANK" as const;
}

function getReferencePrefix(source: string) {
  if (source === "water_bill") return "WB";
  if (source === "rent_charge") return "RC";
  if (source === "advance_rent") return "AR";
  return "PMT";
}

function formatReceiptNo(paymentId: string) {
  return `RCT-${new Date().getFullYear()}-${paymentId.slice(-8).toUpperCase()}`;
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

      const payment = await tx.payment.create({
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
          gatewayStatus: "SUCCESS",
          verificationStatus: "VERIFIED",
          phoneUsed: phoneNumber || null,
          reference: `${getReferencePrefix(source)}-${charge.period}-${Date.now()}`,
          externalReference: accountName || null,
          paidAt,
          notes: "Tenant self-service payment.",
        },
        select: { id: true },
      });

      await allocateRentPayment({
        db: tx,
        orgId: session.activeOrgId!,
        paymentId: payment.id,
        leaseId: charge.lease.id,
        amount,
        startPeriod: charge.period,
        months: 1,
      });

      await tx.receipt.create({
        data: {
          paymentId: payment.id,
          receiptNo: formatReceiptNo(payment.id),
        },
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id, userId: session.userId }],
        type: "PAYMENT_RECEIVED",
        title: "Payment received",
        message: `Your ${charge.chargeType.toLowerCase().replaceAll("_", " ")} payment for ${charge.period} has been received and verified. Receipt ${formatReceiptNo(payment.id)} is available in EstateDesk.`,
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id }],
        channels: ["IN_APP"],
        type: "PAYMENT_VERIFIED",
        title: "Tenant payment verified",
        message: `${tenant.fullName} paid ${charge.period} for ${charge.lease.unit.property.name} / Unit ${charge.lease.unit.houseNo}.`,
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

      const payment = await tx.payment.create({
        data: {
          orgId: session.activeOrgId!,
          payerTenantId: tenant.id,
          payerUserId: session.userId,
          payerType: "TENANT",
          payerName: tenant.fullName,
          method: paymentMethod,
          amount,
          targetType: "RENT",
          gatewayStatus: "SUCCESS",
          verificationStatus: "VERIFIED",
          phoneUsed: phoneNumber || null,
          reference: `${getReferencePrefix(source)}-${getCurrentPeriod()}-${Date.now()}`,
          externalReference: accountName || null,
          paidAt,
          notes: `Advance rent payment for up to ${months} month${months === 1 ? "" : "s"}.`,
        },
        select: { id: true },
      });

      const allocation = await allocateRentPayment({
        db: tx,
        orgId: session.activeOrgId!,
        paymentId: payment.id,
        leaseId: lease.id,
        amount,
        startPeriod: getCurrentPeriod(),
        months,
      });

      await tx.receipt.create({
        data: {
          paymentId: payment.id,
          receiptNo: formatReceiptNo(payment.id),
        },
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id, userId: session.userId }],
        type: "PAYMENT_RECEIVED",
        title: "Advance rent received",
        message: `Your advance rent payment covering ${allocation.coveredPeriods.join(", ")} has been received and verified. Receipt ${formatReceiptNo(payment.id)} is available in EstateDesk.`,
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id }],
        channels: ["IN_APP"],
        type: "PAYMENT_VERIFIED",
        title: "Advance rent verified",
        message: `${tenant.fullName} paid advance rent for ${lease.unit.property.name} / Unit ${lease.unit.houseNo}.`,
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

      const amount = Number(bill.total ?? 0);

      const payment = await tx.payment.create({
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
          gatewayStatus: "SUCCESS",
          verificationStatus: "VERIFIED",
          phoneUsed: phoneNumber || null,
          reference: `${getReferencePrefix(source)}-${bill.period}-${Date.now()}`,
          externalReference: accountName || null,
          paidAt,
          notes: "Tenant self-service payment.",
        },
        select: { id: true },
      });

      await tx.receipt.create({
        data: {
          paymentId: payment.id,
          receiptNo: formatReceiptNo(payment.id),
        },
      });

      await tx.waterBill.update({
        where: { id: bill.id },
        data: {
          status: "PAID_VERIFIED",
        },
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id, userId: session.userId }],
        type: "PAYMENT_RECEIVED",
        title: "Water payment received",
        message: `Your water bill payment for ${bill.period} has been received and verified. Receipt ${formatReceiptNo(payment.id)} is available in EstateDesk.`,
      });

      await notifyRecipients({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: [{ tenantId: tenant.id }],
        channels: ["IN_APP"],
        type: "PAYMENT_VERIFIED",
        title: "Water bill cleared",
        message: `${tenant.fullName} cleared water bill ${bill.period} for ${bill.unit.property.name} / Unit ${bill.unit.houseNo}.`,
      });

      return;
    }

    throw new Error("Unsupported payment source.");
  });

  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/tenant/water-bills");
  revalidatePath("/dashboard/org/payments");
  revalidatePath("/dashboard/org/charges");
  revalidatePath("/dashboard/org/notifications");

  redirect(`/dashboard/tenant/payments?${params.toString()}&status=verified`);
}
