import { getTransactionMessage } from "@/app/(app)/dashboard/org/payments/_lib/helpers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobilePaymentReviewInputSchema } from "@estatedesk/contracts/mobile";
import { requireOrgPermission } from "@/lib/permissions/guards";
import { reviewWhere } from "@/lib/mobile/payment-review";
import { revalidatePaymentSurfaces } from "@/app/(app)/dashboard/org/payments/_lib/payment-action-shared";
import { verifyPayment } from "@/app/(app)/dashboard/org/payments/_lib/verify-payment";
import { notifyRecipients } from "@/lib/notifications/notify";
export async function GET(request: Request) {
  return nativeRoute(request, async () => {
    const session = await requireOrgPermission("payments.verify");
    const page = z.coerce.number().int().min(1).max(10000).parse(new URL(request.url).searchParams.get("page") ?? 1);
    const rows = await prisma.payment.findMany({ where: reviewWhere(session), orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: (page - 1) * 25, take: 26,
      select: { id: true, amount: true, method: true, externalReference: true, reference: true, callbackRaw: true, createdAt: true, payerTenant: { select: { fullName: true } } } });
    return mobileJson({ page, hasMore: rows.length > 25, payments: rows.slice(0, 25).map(p => ({ id: p.id, amount: Number(p.amount), method: p.method, reference: p.externalReference ?? p.reference, payer: p.payerTenant?.fullName ?? "Payment account", proof: getTransactionMessage(p.callbackRaw) || null, createdAt: p.createdAt.toISOString() })) });
  });
}
export async function POST(request: Request) {
  return nativeRoute(request, async () => {
    const session = await requireOrgPermission("payments.verify");
    const input = await nativeBody(request, mobilePaymentReviewInputSchema);
    const result = await prisma.$transaction(async tx => {
      const payment = await tx.payment.findFirst({ where: { AND: [reviewWhere(session), { id: input.id }] }, include: { payerTenant: { select: { id: true, userId: true } } } });
      if (!payment) return false;
      if (input.action === "verify") await verifyPayment(tx, session, payment.id, input.note);
      else {
        // Serializable isolation prevents rejection racing a financial verification.
        await tx.payment.update({ where: { id: payment.id }, data: { gatewayStatus: "CANCELLED", verificationStatus: "REJECTED", reconciliationStatus: "DISPUTED", reconciliationNotes: input.note, notes: `${payment.notes ?? ""} Rejected: ${input.note}`.trim() } });
        if (payment.waterBillId) await tx.waterBill.update({ where: { id: payment.waterBillId }, data: { status: "ISSUED" } });
        if (payment.payerTenant) await notifyRecipients({ db: tx, orgId: session.activeOrgId!, actorUserId: session.userId, recipients: [{ tenantId: payment.payerTenant.id, userId: payment.payerTenant.userId }], type: "GENERAL", title: "Payment rejected", message: `Your submitted payment was rejected: ${input.note}` });
        await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, action: "PAYMENT_REJECTED", entityType: "Payment", entityId: payment.id, metadata: { reason: input.note }, beforeState: { verificationStatus: payment.verificationStatus }, afterState: { verificationStatus: "REJECTED" } } });
      }
      return true;
    }, { isolationLevel: "Serializable" });
    if (result) revalidatePaymentSurfaces();
    return result ? mobileJson({ ok: true }) : mobileJson({ error: "Payment is no longer pending or is outside your scope. Refresh the queue." }, 409);
  });
}
