"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { queryMpesaStkPush, MpesaRequestError } from "@/lib/mpesa/client";
import { mpesaFailureMessage } from "@/lib/mpesa/result-message";

export async function checkTenantStkStatus(paymentId: string) {
  const session = await requireTenantAccess();
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, orgId: session.activeOrgId!, method: "MPESA_STK", payerTenant: { userId: session.userId, deletedAt: null } },
    select: { id: true, orgId: true, checkoutRequestId: true, gatewayStatus: true, verificationStatus: true },
  });
  if (!payment) return { message: "Payment not found." };
  if (!["PENDING", "INITIATED"].includes(payment.gatewayStatus) || payment.verificationStatus === "VERIFIED") {
    return { message: `Payment status: ${payment.gatewayStatus.toLowerCase()}.` };
  }
  if (!payment.checkoutRequestId) return { message: "M-Pesa did not return a tracking ID. The result is unknown; contact your property manager before retrying." };
  try {
    const result = await queryMpesaStkPush(payment.orgId, payment.checkoutRequestId);
    if (result.resultCode === null) return { message: result.description };
    if (result.resultCode === 0) return { message: "M-Pesa reports success. Waiting for the receipt callback to confirm the amount and clear your bill." };
    const message = mpesaFailureMessage(result.resultCode, result.description);
    // A callback may have settled the payment while the query was in flight.
    await prisma.payment.updateMany({
      where: { id: payment.id, gatewayStatus: { in: ["PENDING", "INITIATED"] }, verificationStatus: "NOT_REQUIRED", reversedAt: null },
      data: { gatewayStatus: "FAILED", verificationStatus: "REJECTED", notes: message },
    });
    revalidatePath("/dashboard/tenant/payments");
    revalidatePath("/dashboard/org/payments");
    return { message };
  } catch (error) {
    return { message: error instanceof MpesaRequestError ? error.message : "M-Pesa status is temporarily unavailable. No new request was sent. Check again shortly." };
  }
}
