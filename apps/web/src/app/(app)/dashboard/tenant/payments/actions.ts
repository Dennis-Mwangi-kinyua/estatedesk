"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { throwSafeActionFailure } from "@/lib/errors/server-error-log";
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
  const normalized = message.toUpperCase().replace(/\s+/g, " ").trim();
  const compact = normalized.replace(/\s+/g, "");

  // Tenants often paste only the 10-character code (e.g. QAB12CD34E).
  if (/^[A-Z0-9]{10}$/.test(compact)) {
    return compact;
  }

  const match =
    normalized.match(/\b([A-Z0-9]{10})\s+CONFIRMED\b/) ??
    normalized.match(/\b([A-Z0-9]{10})\b/);

  return match?.[1] ?? "";
}

function rejectManualPayment(message: string): never {
  redirect(
    `/dashboard/tenant/payments?error=${encodeURIComponent(message)}&messageType=error`,
  );
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
    rejectManualPayment("Missing tenant session context. Sign in again and retry.");
  }

  let amount: number;
  try {
    amount = readAmount(formData);
  } catch (error) {
    rejectManualPayment(
      error instanceof Error ? error.message : "Enter a valid payment amount.",
    );
  }

  const transactionMessage = readString(formData, "transactionMessage");
  const transactionCode = normalizeTransactionReference(
    extractMpesaCode(transactionMessage),
  );

  if (!transactionMessage) {
    rejectManualPayment(
      "Paste the M-Pesa confirmation message or the 10-character transaction code.",
    );
  }

  if (!transactionCode || !/^[A-Z0-9]{10}$/.test(transactionCode)) {
    rejectManualPayment(
      "Could not find a valid 10-character M-Pesa code (e.g. QAB12CD34E). Paste the full SMS or just the code.",
    );
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
        // Combined period bill: verify allocates rent first, then water.
        targetType: "COMBINED",
        gatewayStatus: "PENDING",
        verificationStatus: "PENDING",
        reference: `BILL-${period}-${normalizeReferencePart(unitLabel) || "UNIT"}`,
        externalReference: transactionCode,
        transactionReferenceKey,
        paidAt,
        notes:
          "Tenant pasted M-Pesa message for combined rent + water bill. Awaiting organization verification.",
        callbackRaw: {
          source: "period_bill",
          combined: true,
          transactionCode,
          transactionMessage,
          leaseId: activeLease.id,
          period,
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
      title: "Bill payment submitted",
      message: `Your rent + water bill payment ${transactionCode} has been submitted and is awaiting verification.`,
    });

    await notifyRecipients({
      db: tx,
      orgId: session.activeOrgId!,
      recipients: await getPaymentReviewRecipients(tx, session.activeOrgId!),
      channels: ["IN_APP"],
      type: "GENERAL",
      title: "Bill payment needs verification",
      message: `${tenant.fullName} submitted combined bill payment ${transactionCode} for ${activeLease.unit.property.name} / Unit ${activeLease.unit.houseNo}.`,
    });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      rejectManualPayment("That M-Pesa transaction code has already been submitted.");
    }

    if (error instanceof Error) {
      const known = [
        "Tenant profile not found.",
        "No active lease found for rent payment submission.",
        "That transaction code has already been submitted.",
      ];
      if (known.includes(error.message)) {
        rejectManualPayment(error.message);
      }
    }

    throwSafeActionFailure(
      "tenantRentPaymentSubmission",
      error,
      "Could not submit the rent payment. Please try again.",
    );
  }

  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/org/payments");
  revalidatePath("/dashboard/org/notifications");

  redirect("/dashboard/tenant/payments?status=pending");
}
