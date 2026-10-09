"use server";
import { prisma } from "@/lib/prisma";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { readString, revalidatePaymentSurfaces } from "./payment-action-shared";
import { verifyPayment } from "./verify-payment";
import { normalizeTransactionReference, isUniqueConstraintError } from "@/lib/payments/transaction-reference";
import { parseMoveOutDate, nairobiDate } from "@/lib/move-outs/validation";
import { saveImagePayloadAsset } from "@/lib/uploads/image-payload";
import { notifyRecipients } from "@/lib/notifications/notify";

export async function recordCashPaymentAction(form: FormData) {
  const session = await requireOrgPermission("payments.record");
  const orgId = session.activeOrgId!;
  const leaseId = readString(form, "leaseId");
  const rawAmount = readString(form, "amount");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(rawAmount) || Number(rawAmount) <= 0) throw new Error("Enter a positive amount with at most two decimal places.");
  const receiptReference = normalizeTransactionReference(readString(form, "receiptReference"));
  if (!receiptReference || receiptReference.length > 100) throw new Error("Enter the cash receipt number (up to 100 characters).");
  const period = readString(form, "period");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error("Choose a valid billing month.");
  const paidAt = parseMoveOutDate(readString(form, "paidAt"));
  if (nairobiDate(paidAt) > nairobiDate()) throw new Error("Payment date cannot be in the future.");
  const evidence = readString(form, "evidence");
  if (evidence.length < 5 || evidence.length > 2000 || form.get("cashConfirmed") !== "on") throw new Error("Confirm cash was received and describe the evidence (5–2,000 characters).");
  const lease = await prisma.lease.findFirst({ where: { id: leaseId, orgId, deletedAt: null, status: { in: ["ACTIVE", "TERMINATED"] } }, include: { tenant: { select: { id: true, fullName: true, userId: true } } } });
  if (!lease) throw new Error("Tenant lease not found in this organisation.");
  const key = `CASH:${orgId}:${receiptReference}`;
  if (await prisma.payment.findUnique({ where: { transactionReferenceKey: key }, select: { id: true } })) throw new Error("This cash receipt has already been recorded. Review the existing payment instead.");
  let proofAssetId: string | null = null;
  const proof = form.get("proof");
  if (proof instanceof File && proof.size > 0) {
    if (proof.size > 2 * 1024 * 1024) throw new Error("Use a receipt photo under 2MB.");
    proofAssetId = await saveImagePayloadAsset({ payload: { base64: Buffer.from(await proof.arrayBuffer()).toString("base64"), fileName: proof.name, mimeType: proof.type, size: proof.size }, uploadDir: "payment-proof", filePrefix: "cash", orgId, unitId: lease.unitId, submittedByUserId: session.userId, purpose: "payment_proof" });
  }
  const proofAsset = proofAssetId ? await prisma.asset.findUnique({ where: { id: proofAssetId }, select: { key: true } }) : null;
  const canVerify = roleHasOrgPermission(session.activeOrgRole, "payments.verify");
  try {
    await prisma.$transaction(async tx => {
      const payment = await tx.payment.create({ data: { orgId, payerTenantId: lease.tenant.id, payerUserId: lease.tenant.userId, payerName: lease.tenant.fullName, method: "CASH", amount: rawAmount, externalReference: receiptReference, transactionReferenceKey: key, reference: receiptReference, targetType: "COMBINED", gatewayStatus: "PENDING", verificationStatus: "PENDING", paidAt, notes: evidence, callbackRaw: { source: "staff_cash_entry", combined: true, leaseId, period, transactionMessage: evidence, proofAssetId, proofImageUrl: proofAsset?.key ?? null, recordedByUserId: session.userId } } });
      await tx.auditLog.create({ data: { orgId, actorUserId: session.userId, action: "CASH_PAYMENT_RECORDED", entityType: "Payment", entityId: payment.id, metadata: { receiptReference, amount: rawAmount, evidence, proofAssetId } } });
      if (canVerify) {
        await verifyPayment(tx, session, payment.id, evidence);
        await tx.payment.update({ where: { id: payment.id }, data: { reconciliationStatus: "RECONCILED", reconciledAt: new Date(), reconciledByUserId: session.userId, reconciliationNotes: `Cash receipt ${receiptReference} confirmed: ${evidence}` } });
      } else {
        const reviewers = await tx.membership.findMany({ where: { orgId, role: { in: ["ADMIN", "MANAGER", "ACCOUNTANT"] }, employmentEndedAt: null, deactivatedAt: null, user: { status: "ACTIVE", deletedAt: null } }, distinct: ["userId"], select: { userId: true } });
        await notifyRecipients({ db: tx, orgId, actorUserId: session.userId, recipients: reviewers, type: "GENERAL", title: "Cash payment awaiting review", message: `Review cash receipt ${receiptReference} for ${lease.tenant.fullName}.`, actionUrl: "/dashboard/org/payments" });
      }
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error("This cash receipt has already been recorded.");
    throw error;
  }
  revalidatePaymentSurfaces();
  return { verified: canVerify };
}
