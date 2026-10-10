"use server";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { parseMoveOutDate } from "@/lib/move-outs/validation";
import { depositHeldCents, finalBillingIssues } from "@/lib/move-outs/readiness";
import { loadMoveOutBalances } from "@/lib/move-outs/balances";
export async function getSettlementPreview(noticeId: string, handoverDate?: string) {
  const session = await requireManagementAccess();
  const notice = await prisma.moveOutNotice.findFirst({ where: { id: noticeId, lease: { orgId: session.activeOrgId!, deletedAt: null } }, include: { lease: true } });
  if (!notice) throw new Error("Move-out not found.");
  const balances = await loadMoveOutBalances(prisma, notice.lease);
  const issues = handoverDate ? await finalBillingIssues(prisma, notice.lease, parseMoveOutDate(handoverDate)) : [];
  const credit = await prisma.payment.findFirst({ where: { orgId: session.activeOrgId!, payerTenantId: notice.tenantId, verificationStatus: "VERIFIED", unappliedAmount: { gt: 0 } }, select: { id: true } });
  if (credit) issues.push("This tenant has unapplied payment credit. Allocate or refund that credit before closing the account.");
  return { issues, depositHeld: (await depositHeldCents(prisma, notice.lease)) / 100, outstandingBills: balances.totalCents / 100, lines: [...balances.charges.map(charge => ({ label: `${charge.period} ${charge.description ?? charge.chargeType}`, amount: Number(charge.balance) })), ...balances.water.map(bill => ({ label: `${bill.period} water`, amount: bill.remainingCents / 100 }))] };
}
