"use server";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { depositHeldCents } from "@/lib/move-outs/readiness";
import { loadMoveOutBalances } from "@/lib/move-outs/balances";
export async function getSettlementPreview(noticeId: string) {
  const session = await requireManagementAccess();
  const notice = await prisma.moveOutNotice.findFirst({ where: { id: noticeId, lease: { orgId: session.activeOrgId!, deletedAt: null } }, include: { lease: true } });
  if (!notice) throw new Error("Move-out not found.");
  const balances = await loadMoveOutBalances(prisma, notice.lease);
  return { depositHeld: (await depositHeldCents(prisma, notice.lease)) / 100, outstandingBills: balances.totalCents / 100, lines: [...balances.charges.map(charge => ({ label: `${charge.period} ${charge.description ?? charge.chargeType}`, amount: Number(charge.balance) })), ...balances.water.map(bill => ({ label: `${bill.period} water`, amount: bill.remainingCents / 100 }))] };
}
