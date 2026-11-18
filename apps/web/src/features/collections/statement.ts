import "server-only";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assertManagementSession } from "@/features/org-management/policy";

/** Shared web/native statement, including identical access and rent-only rules. */
export async function rentStatement(session: AppSession, tenantId: string, requestedPage = 1) {
  const orgId = assertManagementSession(session, "collections");
  const page = Math.max(1, Math.min(10000, Math.trunc(requestedPage) || 1));
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, orgId, deletedAt: null }, select: { fullName: true } });
  if (!tenant) return null;
  const where = { orgId, chargeType: "RENT" as const, lease: { orgId, tenantId, deletedAt: null }, status: { in: ["UNPAID", "PARTIAL", "PAID", "OVERDUE"] as ("UNPAID" | "PARTIAL" | "PAID" | "OVERDUE")[] } };
  const [charges, totals, count, org] = await Promise.all([
    prisma.rentCharge.findMany({ where, orderBy: [{ dueDate: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 25, include: { lease: { select: { unit: { select: { houseNo: true, property: { select: { name: true } } } } } } } }),
    prisma.rentCharge.aggregate({ where, _sum: { amountDue: true, amountPaid: true, balance: true } }),
    prisma.rentCharge.count({ where }),
    prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { currencyCode: true } }),
  ]);
  return { tenant, charges, totals, count, page, currency: org.currencyCode };
}
