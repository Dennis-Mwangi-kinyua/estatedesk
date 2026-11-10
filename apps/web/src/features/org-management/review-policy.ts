import "server-only";
import type { Prisma } from "@prisma/client";
import type { AppSession } from "@/lib/auth/session";
import { ensure } from "./policy";

/** Once configured, the same monetary limit applies through legacy finance screens. */
export async function enforceFinancialReview(tx: Prisma.TransactionClient, session: AppSession, authorId: string, amount: { toString(): string }) {
  const policy = await tx.orgManagementPolicy.findUnique({ where: { orgId: session.activeOrgId! } });
  if (!policy) return;
  ensure(authorId !== session.userId, "A different staff member must approve this financial request.");
  ensure(session.activeOrgRole === "ADMIN" || Number(amount) <= Number(policy.managerApprovalLimit), "This amount exceeds your approval limit. Ask an administrator to review it.");
}
