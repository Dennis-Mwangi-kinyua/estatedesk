"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/ledger";
import { notifyRecipients } from "@/lib/notifications/notify";
import { requireTenantAccess } from "@/lib/permissions/guards";
import {
  buildMpesaTransactionKey,
  isUniqueConstraintError,
  normalizeTransactionReference,
} from "@/lib/payments/transaction-reference";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readAmount(formData: FormData) {
  const raw = readString(formData, "amount").replace(/,/g, "");
  const amount = Number(raw);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid payment amount.");
  }

  return amount;
}

function extractMpesaCode(message: string) {
  const normalized = message.toUpperCase();
  const match =
    normalized.match(/\b([A-Z0-9]{10})\s+CONFIRMED\b/) ??
    normalized.match(/\b([A-Z0-9]{10})\b/);

  return match?.[1] ?? "";
}

function extractPaidAt(message: string) {
  const match = message.match(/\bon\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  const [, dayRaw, monthRaw, yearRaw, hourRaw, minuteRaw, meridiemRaw] = match;
  const yearValue = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);
  const monthValue = Number(monthRaw) - 1;
  let hourValue = Number(hourRaw);
  const minuteValue = Number(minuteRaw);
  const meridiem = meridiemRaw?.toUpperCase();

  if (meridiem === "PM" && hourValue < 12) hourValue += 12;
  if (meridiem === "AM" && hourValue === 12) hourValue = 0;

  const date = new Date(yearValue, monthValue, Number(dayRaw), hourValue, minuteValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeReferencePart(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
}

async function getPaymentReviewRecipients(
  db: Prisma.TransactionClient,
  orgId: string,
) {
  const memberships = await db.membership.findMany({
    where: {
      orgId,
      role: { in: ["ADMIN", "MANAGER", "ACCOUNTANT"] },
      user: { status: "ACTIVE", deletedAt: null },
    },
    select: { userId: true },
  });

  return memberships.map((membership) => ({ userId: membership.userId }));
}

export async function submitManualRentMpesaAction(formData: FormData) {
  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    throw new Error("Missing tenant session context.");
  }

  const amount = readAmount(formData);
  const transactionMessage = readString(formData, "transactionMessage");
  const transactionCode = normalizeTransactionReference(extractMpesaCode(transactionMessage));

  if (transactionMessage.length < 20) {
    throw new Error("Paste the full M-Pesa transaction message.");
  }

  if (!transactionCode) {
    throw new Error("Could not find the M-Pesa transaction code in that message.");
  }

  const transactionReferenceKey = buildMpesaTransactionKey(transactionCode);

  try {
    await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findFirst({
      where: {
        userId: session.userId,
        orgId: session.activeOrgId!,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        userId: true,
        leases: {
          where: { status: "ACTIVE", deletedAt: null },
          orderBy: { startDate: "desc" },
          take: 1,
          select: {
            id: true,
            unit: {
              select: {
                houseNo: true,
                property: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new Error("Tenant profile not found.");
    }

    const activeLease = tenant.leases[0];
    if (!activeLease) {
      throw new Error("No active lease found for rent payment submission.");
    }

    const existing = await tx.payment.findUnique({
      where: { transactionReferenceKey },
      select: { id: true },
    });

    if (existing) {
      throw new Error("That transaction code has already been submitted.");
    }

    const period = getCurrentPeriod();
    const unitLabel = activeLease.unit.houseNo;
    const paidAt = extractPaidAt(transactionMessage);

    await tx.payment.create({
      data: {
        orgId: session.activeOrgId!,
        payerTenantId: tenant.id,
        payerUserId: session.userId,
        payerType: "TENANT",
        payerName: tenant.fullName,
        method: "MPESA_MANUAL",
        amount,
        targetType: "RENT",
        gatewayStatus: "PENDING",
        verificationStatus: "PENDING",
        reference: `RENT-${period}-${normalizeReferencePart(unitLabel) || "UNIT"}`,
        externalReference: transactionCode,
        transactionReferenceKey,
        paidAt,
        notes: "Tenant pasted M-Pesa rent transaction message awaiting organization verification.",
        callbackRaw: {
          source: "manual_mpesa_message",
          transactionCode,
          transactionMessage,
          leaseId: activeLease.id,
          startPeriod: period,
          months: 1,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    await notifyRecipients({
      db: tx,
      orgId: session.activeOrgId!,
      recipients: [{ tenantId: tenant.id, userId: tenant.userId }],
      type: "GENERAL",
      title: "Rent payment submitted",
      message: `Your rent payment ${transactionCode} has been submitted and is awaiting verification.`,
    });

    await notifyRecipients({
      db: tx,
      orgId: session.activeOrgId!,
      recipients: await getPaymentReviewRecipients(tx, session.activeOrgId!),
      channels: ["IN_APP"],
      type: "GENERAL",
      title: "Rent payment needs verification",
      message: `${tenant.fullName} submitted rent payment ${transactionCode} for ${activeLease.unit.property.name} / Unit ${activeLease.unit.houseNo}.`,
    });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("That M-Pesa transaction code has already been submitted.");
    }
    throw error;
  }

  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/org/payments");
  revalidatePath("/dashboard/org/notifications");

  redirect("/dashboard/tenant/payments?status=pending");
}
