"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { isBillingPeriod } from "@/lib/billing/period-dates";
import { getPeriodBillForTenant } from "@/lib/billing/period-bill";
import { processPeriodBillPayment } from "@/app/(app)/dashboard/tenant/payments/checkout/_lib/handlers/period-bill-payment";
import {
  buildCheckoutTransactionKey,
  getCheckoutSettlementMode,
  mapCheckoutMethodToPaymentMethod,
  validateCheckoutTransactionId,
} from "@/lib/payments/method-flow";
import { parsePaymentInstructions } from "@/lib/payments/instructions";
import { isUniqueConstraintError } from "@/lib/payments/transaction-reference";
import { createPaymentProofAsset } from "@/lib/payments/proof";
import { validateImageFile } from "@/lib/uploads/secure-image";

const METHODS = new Set(["cash", "manual-mpesa", "manual-bank"]);

function proofPath(notice: string) {
  return `/dashboard/tenant/invoice?notice=${notice}`;
}

function knownProofNotice(error: unknown) {
  if (isUniqueConstraintError(error)) return "proof-duplicate";
  const message = error instanceof Error ? error.message : "";
  if (message.includes("already cleared")) return "proof-clear";
  if (
    message.includes("valid payment amount")
    || message.includes("No active lease")
    || message.includes("Invalid billing period")
  ) return "proof-invalid";
  return null;
}

export async function submitInvoiceProofAction(formData: FormData) {
  const session = await requireTenantAccess();
  if (!session.userId || !session.activeOrgId) redirect("/dashboard/tenant");
  const period = String(formData.get("period") ?? "");
  const method = String(formData.get("method") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!isBillingPeriod(period) || !METHODS.has(method)) redirect(proofPath("proof-invalid"));
  if (method === "cash" && (note.length < 3 || note.length > 240)) redirect(proofPath("proof-invalid"));
  if (note.length > 240) redirect(proofPath("proof-invalid"));

  let transactionId = "";
  if (method !== "cash") {
    const validated = validateCheckoutTransactionId(method, String(formData.get("transactionId") ?? ""));
    if (!validated.ok) redirect(proofPath("proof-invalid"));
    transactionId = validated.transactionId;
  }

  const proof = formData.get("proofImage");
  let proofImage: Awaited<ReturnType<typeof validateImageFile>> | null = null;
  if (proof instanceof File && proof.size > 0) {
    try {
      proofImage = await validateImageFile(proof, { maxBytes: 5 * 1024 * 1024 });
    } catch {
      redirect(proofPath("proof-image"));
    }
  }

  const orgId = session.activeOrgId;
  const [tenant, settings] = await Promise.all([
    prisma.tenant.findFirst({
      where: { userId: session.userId, orgId, deletedAt: null },
      select: { id: true, fullName: true },
    }),
    prisma.organizationSettings.findUnique({ where: { orgId }, select: { customFields: true } }),
  ]);
  if (!tenant) redirect("/dashboard/tenant");

  const bill = await getPeriodBillForTenant({ db: prisma, orgId, tenantId: tenant.id, period });
  if (!bill || bill.balance <= 0) redirect(proofPath("proof-clear"));

  const amountRaw = String(formData.get("amount") ?? "").trim();
  let amount: number | undefined;
  if (amountRaw) {
    const requested = Number(amountRaw);
    if (!Number.isFinite(requested) || requested <= 0 || requested > bill.balance + 0.001) redirect(proofPath("proof-amount"));
    amount = Math.round(Math.min(requested, bill.balance) * 100) / 100;
  }

  const instructions = parsePaymentInstructions(settings?.customFields);
  const transactionReferenceKey = transactionId
    ? buildCheckoutTransactionKey({ method, transactionId, instructions })
    : null;
  if (method !== "cash" && !transactionReferenceKey) redirect(proofPath("proof-invalid"));

  try {
    await prisma.$transaction(async (tx) => {
      const created = await processPeriodBillPayment({
        tx,
        orgId,
        userId: session.userId!,
        tenant,
        paymentMethod: mapCheckoutMethodToPaymentMethod(method),
        checkoutMethod: method,
        settlementMode: getCheckoutSettlementMode(method),
        paidAt: new Date(),
        transactionId,
        transactionReferenceKey,
        source: "period_bill",
        sourceId: period,
        proofMessage: note || undefined,
      }, amount == null ? {} : { amount });
      if (!proofImage || !(proof instanceof File)) return;
      const asset = await createPaymentProofAsset(tx, {
        image: proofImage,
        fileName: proof.name,
        orgId,
        userId: session.userId!,
        paymentId: created.id,
        unitId: bill.unitId,
      });
      const payment = await tx.payment.findUniqueOrThrow({ where: { id: created.id }, select: { callbackRaw: true } });
      const raw = payment.callbackRaw && typeof payment.callbackRaw === "object" && !Array.isArray(payment.callbackRaw)
        ? payment.callbackRaw as Prisma.JsonObject
        : {};
      await tx.payment.update({
        where: { id: created.id },
        data: { callbackRaw: { ...raw, proofImageUrl: asset.key, proofAssetId: asset.id } },
      });
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const notice = knownProofNotice(error);
    if (notice) redirect(proofPath(notice));
    throw error;
  }

  revalidatePath("/dashboard/tenant/invoice");
  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/payments");
  revalidatePath("/dashboard/org/operating-queue");
  revalidatePath("/dashboard/org/charges/bills");
  revalidatePath(`/dashboard/org/charges/bills/${bill.leaseId}`);
  redirect(proofPath("proof-sent"));
}
