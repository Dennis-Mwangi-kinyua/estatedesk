"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { throwSafeActionFailure } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { parsePaymentInstructions } from "@/lib/payments/instructions";
import {
  buildBankTransactionKey,
  buildMpesaTransactionKey,
  isUniqueConstraintError,
  normalizeTransactionReference,
} from "@/lib/payments/transaction-reference";
import { processAdvanceRentPayment } from "./handlers/advance-rent-payment";
import { processRentChargePayment } from "./handlers/rent-charge-payment";
import { processWaterBillPayment } from "./handlers/water-bill-payment";
import type { PaymentHandlerContext } from "./payment-handler-context";
import { mapPaymentMethod } from "./reference";
import type { StartPaymentInput } from "./types";

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
      const ctx: PaymentHandlerContext = {
        tx,
        orgId: session.activeOrgId!,
        userId: session.userId!,
        tenant,
        paymentMethod,
        paidAt,
        transactionId,
        transactionReferenceKey,
        phoneNumber,
        accountName,
        source,
        sourceId: id,
      };

      if (source === "rent_charge") {
        await processRentChargePayment(ctx);
        return;
      }

      if (source === "advance_rent") {
        await processAdvanceRentPayment(ctx, {
          amount: Number(input.amount ?? 0),
          months: Number(input.months ?? 1),
        });
        return;
      }

      if (source === "water_bill") {
        await processWaterBillPayment(ctx);
        return;
      }

      throw new Error("Unsupported payment source.");
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("That transaction ID has already been submitted.");
    }
    throwSafeActionFailure(
      "tenantPaymentCheckout",
      error,
      "Could not start the payment. Please try again.",
    );
  }

  revalidatePath("/dashboard/tenant/payments");
  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/tenant/water-bills");
  revalidatePath("/dashboard/org/payments");
  revalidatePath("/dashboard/org/charges");
  revalidatePath("/dashboard/org/notifications");

  redirect(`/dashboard/tenant/payments?${params.toString()}&status=pending`);
}