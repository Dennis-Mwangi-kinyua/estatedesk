"use server";

import { Prisma } from "@prisma/client";
import { validateImageFile } from "@/lib/uploads/secure-image";
import { createPaymentProofAsset } from "@/lib/payments/proof";
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
  mapCheckoutMethodToPaymentMethod,
  requiresAccountNameForCheckout,
  requiresPhoneForCheckout,
  requiresTransactionIdForCheckout,
  validateCheckoutTransactionId,
} from "@/lib/payments/method-flow";
import { isMpesaStkConfigured } from "@/lib/mpesa/config";
import { isUniqueConstraintError } from "@/lib/payments/transaction-reference";
import { getMpesaAccessTokenForOrg, requestMpesaStkPush, normalizeMpesaPhone, MpesaRequestError } from "@/lib/mpesa/client";
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

  const [tenant, settings] = await Promise.all([
    prisma.tenant.findFirst({
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
    }),
    prisma.organizationSettings.findUnique({
      where: { orgId: session.activeOrgId },
      select: { customFields: true },
    }),
  ]);

  if (!tenant) {
    throw new Error("Tenant profile not found.");
  }

  const instructions = { ...parsePaymentInstructions(settings?.customFields), mpesaStkEnabled: isMpesaStkConfigured(session.activeOrgId) };

  if (!isPaymentMethodAvailable(instructions, method)) {
    throw new Error(
      "This payment method is not available for your organization.",
    );
  }

  const settlementMode = getCheckoutSettlementMode(method);
  const isGateway = isGatewayCheckoutMethod(method);

  if (isGateway && method === "mpesa-stk" && !isMpesaStkConfigured(session.activeOrgId)) {
    throw new Error(
      "M-Pesa STK is not configured on this server. Use Manual M-Pesa instead.",
    );
  }

  if (requiresPhoneForCheckout(method) && !phoneNumber?.trim()) {
    throw new Error("Phone number is required for this payment method.");
  }
  if (method === "mpesa-stk") normalizeMpesaPhone(phoneNumber!);

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
  if (input.proofImage && settlementMode !== "manual") {
    throw new Error("Payment screenshots are supported for manual payments.");
  }
  const proofImage = input.proofImage
    ? await validateImageFile(input.proofImage, { maxBytes: 5 * 1024 * 1024 })
    : null;
  let paymentId: string | null = null;
  let paymentAmount = Number(input.amount ?? 0);
  let paymentReference: string | null = null;

  // Start Daraja OAuth while the payment transaction runs. Warm server
  // instances reuse this organization-scoped token, avoiding an extra network
  // round trip before every customer prompt.
  const stkAccessToken = isGateway && method === "mpesa-stk"
    ? getMpesaAccessTokenForOrg(session.activeOrgId!).then(
        (token) => ({ ok: true as const, token }),
        (error: unknown) => ({ ok: false as const, error }),
      )
    : null;

  try {
    paymentId = await prisma.$transaction(async (tx) => {
      const attachProof = async (id: string) => {
        if (!proofImage) return id;
        const asset = await createPaymentProofAsset(tx, { image: proofImage, fileName: input.proofImage!.name, orgId: session.activeOrgId!, userId: session.userId, paymentId: id });
        const payment = await tx.payment.findUniqueOrThrow({ where: { id }, select: { callbackRaw: true } });
        const raw = payment.callbackRaw && typeof payment.callbackRaw === "object" && !Array.isArray(payment.callbackRaw)
          ? payment.callbackRaw as Prisma.JsonObject : {};
        await tx.payment.update({ where: { id }, data: {
          callbackRaw: { ...raw, proofImageUrl: asset.key, proofAssetId: asset.id },
        } });
        return id;
      };
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
        paymentAmount = Number(result.amount);
        paymentReference = result.reference;
        return attachProof(result.id);
      }

      if (source === "advance_rent") {
        const result = await processAdvanceRentPayment(ctx, {
          amount: Number(input.amount ?? 0),
          months: Number(input.months ?? 1),
        });
        paymentAmount = Number(result.amount);
        paymentReference = result.reference;
        return attachProof(result.id);
      }

      if (source === "water_bill") {
        const result = await processWaterBillPayment(ctx, {
          amount:
            input.amount != null && Number.isFinite(Number(input.amount))
              ? Number(input.amount)
              : undefined,
        });
        paymentAmount = Number(result.amount);
        paymentReference = result.reference;
        return attachProof(result.id);
      }

      if (source === "period_bill") {
        const result = await processPeriodBillPayment(ctx, {
          amount:
            input.amount != null && Number.isFinite(Number(input.amount))
              ? Number(input.amount)
              : undefined,
        });
        paymentAmount = Number(result.amount);
        paymentReference = result.reference;
        return attachProof(result.id);
      }

      throw new Error("Unsupported payment source.");
    }, { timeout: 45_000 });

    // Gateway STK: prompt phone after payment row exists.
    if (isGateway && method === "mpesa-stk" && paymentId) {
      const accessToken = await stkAccessToken;
      if (!accessToken?.ok) throw accessToken?.error ?? new Error("Could not authenticate with M-Pesa.");
      const stk = await requestMpesaStkPush({
        orgId: session.activeOrgId!,
        amount: paymentAmount,
        phone: phoneNumber!.trim(),
        accountReference: paymentReference ?? id.slice(0, 12),
        transactionDesc: "EstateDesk bill",
        accessToken: accessToken.token,
      }).catch(async (error: unknown) => {
        const rejected = error instanceof MpesaRequestError && error.rejected;
        await prisma.payment.updateMany({
          where: { id: paymentId!, gatewayStatus: "INITIATED", verificationStatus: "NOT_REQUIRED" },
          data: {
            gatewayStatus: rejected ? "FAILED" : "INITIATED",
            verificationStatus: rejected ? "REJECTED" : "NOT_REQUIRED",
            notes: rejected ? "M-Pesa rejected the STK request. No payment was confirmed." : "STK request result is unknown. Check its status before trying again.",
          },
        });
        throw error;
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
