"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { throwSafeActionFailure } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import {
  getBankAccountForMethod,
  isPaymentMethodAvailable,
  parsePaymentInstructions,
} from "@/lib/payments/instructions";
import {
  buildCheckoutTransactionKey,
  getCheckoutSettlementMode,
  isBankCheckoutMethod,
  isGatewayCheckoutMethod,
  isMpesaStkConfigured,
  mapCheckoutMethodToPaymentMethod,
  requiresAccountNameForCheckout,
  requiresPhoneForCheckout,
  requiresTransactionIdForCheckout,
  validateCheckoutTransactionId,
} from "@/lib/payments/method-flow";
import { isUniqueConstraintError } from "@/lib/payments/transaction-reference";
import { requestMpesaStkPush } from "@/lib/mpesa/client";
import { processAdvanceRentPayment } from "./handlers/advance-rent-payment";
import { processPeriodBillPayment } from "./handlers/period-bill-payment";
import { processRentChargePayment } from "./handlers/rent-charge-payment";
import { processWaterBillPayment } from "./handlers/water-bill-payment";
import type { PaymentHandlerContext } from "./payment-handler-context";
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

  const settings = await prisma.organizationSettings.findUnique({
    where: { orgId: session.activeOrgId },
    select: { customFields: true },
  });
  const instructions = parsePaymentInstructions(settings?.customFields);

  if (!isPaymentMethodAvailable(instructions, method)) {
    throw new Error(
      "This payment method is not available for your organization.",
    );
  }

  const settlementMode = getCheckoutSettlementMode(method);
  const isGateway = isGatewayCheckoutMethod(method);

  if (isGateway && method === "mpesa-stk" && !isMpesaStkConfigured()) {
    throw new Error(
      "M-Pesa STK is not configured on this server. Use Manual M-Pesa instead.",
    );
  }

  if (requiresPhoneForCheckout(method) && !phoneNumber?.trim()) {
    throw new Error("Phone number is required for this payment method.");
  }

  if (requiresAccountNameForCheckout(method) && !accountName?.trim()) {
    throw new Error("Sender / account name is required for bank transfers.");
  }

  let transactionId = "";
  if (requiresTransactionIdForCheckout(method)) {
    const validated = validateCheckoutTransactionId(
      method,
      input.transactionId ?? "",
    );
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    transactionId = validated.transactionId;
  }

  if (isBankCheckoutMethod(method) && method !== "manual-bank") {
    const bankAccount = getBankAccountForMethod(instructions, method);
    if (!bankAccount) {
      throw new Error(
        "Bank account details are incomplete for this organization.",
      );
    }
  }

  const paymentMethod = mapCheckoutMethodToPaymentMethod(method);
  const paidAt = new Date();
  const transactionReferenceKey = transactionId
    ? buildCheckoutTransactionKey({
        method,
        transactionId,
        instructions,
      })
    : null;

  if (requiresTransactionIdForCheckout(method) && !transactionReferenceKey) {
    throw new Error("Could not build a transaction reference for this payment.");
  }

  const proofMessage = input.proofMessage?.trim() || "";
  let paymentId: string | null = null;
  let paymentAmount = Number(input.amount ?? 0);

  try {
    paymentId = await prisma.$transaction(async (tx) => {
      const ctx: PaymentHandlerContext = {
        tx,
        orgId: session.activeOrgId!,
        userId: session.userId!,
        tenant,
        paymentMethod,
        checkoutMethod: method,
        settlementMode,
        paidAt,
        transactionId,
        transactionReferenceKey,
        phoneNumber,
        accountName,
        source,
        sourceId: id,
        proofMessage: proofMessage || undefined,
      };

      if (source === "rent_charge") {
        const result = await processRentChargePayment(ctx, {
          amount:
            input.amount != null && Number.isFinite(Number(input.amount))
              ? Number(input.amount)
              : undefined,
        });
        paymentAmount = Number(input.amount ?? paymentAmount);
        return result.id;
      }

      if (source === "advance_rent") {
        const result = await processAdvanceRentPayment(ctx, {
          amount: Number(input.amount ?? 0),
          months: Number(input.months ?? 1),
        });
        paymentAmount = Number(input.amount ?? 0);
        return result.id;
      }

      if (source === "water_bill") {
        const result = await processWaterBillPayment(ctx, {
          amount:
            input.amount != null && Number.isFinite(Number(input.amount))
              ? Number(input.amount)
              : undefined,
        });
        return result.id;
      }

      if (source === "period_bill") {
        const result = await processPeriodBillPayment(ctx, {
          amount:
            input.amount != null && Number.isFinite(Number(input.amount))
              ? Number(input.amount)
              : undefined,
        });
        return result.id;
      }

      throw new Error("Unsupported payment source.");
    });

    // Gateway STK: prompt phone after payment row exists.
    if (isGateway && method === "mpesa-stk" && paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { amount: true, reference: true },
      });
      const amount = Number(payment?.amount ?? paymentAmount);
      const stk = await requestMpesaStkPush({
        amount,
        phone: phoneNumber!.trim(),
        accountReference: payment?.reference ?? id.slice(0, 12),
        transactionDesc: "EstateDesk bill",
      });

      if (!stk.checkoutRequestId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            gatewayStatus: "FAILED",
            verificationStatus: "REJECTED",
            notes: "STK push failed: no CheckoutRequestID returned.",
          },
        });
        throw new Error(
          stk.customerMessage ||
            stk.responseDescription ||
            "Could not start M-Pesa STK push.",
        );
      }

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          checkoutRequestId: stk.checkoutRequestId,
          merchantRequestId: stk.merchantRequestId || null,
          gatewayStatus: "PENDING",
          notes: stk.customerMessage || "STK push sent. Waiting for confirmation.",
        },
      });

      params.set("status", "stk_sent");
    } else {
      params.set("status", settlementMode === "manual" ? "pending" : "processing");
    }
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

  redirect(`/dashboard/tenant/payments?${params.toString()}`);
}
