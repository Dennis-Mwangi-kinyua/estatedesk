import "server-only";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { readPage, directoryFilters, tenantAuditFilter } from "./filters";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { decodePublicId } from "@/lib/public-id";

export const pageSize = 20;
export async function getPlatformOrganization(slug: string) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const org = await prisma.organization.findFirst({ where: { OR: [{ slug }, { id: slug }], deletedAt: null }, select: { id: true, slug: true, name: true, currencyCode: true } });
  if (!org) notFound();
  return { org, session };
}
export async function getTenantDirectory(slug: string, query: { q?: string; status?: string; page?: string }) {
  const { org } = await getPlatformOrganization(slug);
  const { q, status, where } = directoryFilters(org.id, query);
  const total = await prisma.tenant.count({ where });
  const page = Math.min(readPage(query.page), Math.max(1, Math.ceil(total / pageSize)));
  const tenants = await prisma.tenant.findMany({ where, orderBy: [{ fullName: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize,
    select: { id: true, fullName: true, phone: true, email: true, status: true, user: { select: { lastLoginAt: true } },
      _count: { select: { leases: true, payments: true } }, leases: { where: { orgId: org.id, deletedAt: null, status: "ACTIVE" }, take: 1, orderBy: { startDate: "desc" }, select: { unit: { select: { houseNo: true, property: { select: { name: true } } } } } } } });
  return { org, tenants, total, page, q, status: status ?? "" };
}
export const tenantTabs = ["profile", "leases", "payments", "charges", "activity", "audit"] as const;
export async function getPlatformTenant(slug: string, tenantRef: string, query: { tab?: string; page?: string }) {
  const { org, session } = await getPlatformOrganization(slug);
  const tenantId = decodePublicId(tenantRef, "tenant");
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, orgId: org.id, deletedAt: null },
    include: { nextOfKin: true, user: { select: { id: true, status: true, lastLoginAt: true, createdAt: true } }, _count: { select: { leases: true, payments: true, actionLogs: true } } } });
  if (!tenant) notFound();
  const tab = tenantTabs.find(tab => tab === query.tab) ?? "profile";
  const paymentWhere: Prisma.PaymentWhereInput = { orgId: org.id, payerTenantId: tenant.id };
  const leaseWhere: Prisma.LeaseWhereInput = { orgId: org.id, tenantId: tenant.id, deletedAt: null };
  const chargeWhere: Prisma.RentChargeWhereInput = { orgId: org.id, lease: leaseWhere };
  const actionWhere = { orgId: org.id, tenantId: tenant.id };
  const auditWhere = tenantAuditFilter(org.id, tenant.id, tenant.userId);
  const [paid, outstanding, leaseCount, chargeCount, auditCount] = await Promise.all([
    prisma.payment.aggregate({ where: { ...paymentWhere, reversedAt: null, OR: [{ gatewayStatus: "SUCCESS" }, { verificationStatus: "VERIFIED" }, { verificationStatus: "NOT_REQUIRED" }] }, _sum: { amount: true } }),
    prisma.rentCharge.aggregate({ where: { ...chargeWhere, balance: { gt: 0 } }, _sum: { balance: true } }),
    prisma.lease.count({ where: leaseWhere }), prisma.rentCharge.count({ where: chargeWhere }), prisma.auditLog.count({ where: auditWhere }),
  ]);
  const counts = { profile: 1, leases: leaseCount, payments: tenant._count.payments, charges: chargeCount, activity: tenant._count.actionLogs, audit: auditCount };
  const page = Math.min(readPage(query.page), Math.max(1, Math.ceil(counts[tab] / pageSize)));
  const paging = { skip: (page - 1) * pageSize, take: pageSize };
  const [leases, payments, charges, actions, audits] = await Promise.all([
    tab === "leases" ? prisma.lease.findMany({ where: leaseWhere, ...paging, orderBy: [{ startDate: "desc" }, { id: "desc" }], include: { unit: { include: { property: { select: { name: true } } } }, signatureEnvelopes: { take: 1, orderBy: { version: "desc" }, select: { status: true, completedAt: true, finalDocumentHash: true } } } }) : [],
    tab === "payments" ? prisma.payment.findMany({ where: paymentWhere, ...paging, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, amount: true, reference: true, externalReference: true, method: true, targetType: true, gatewayStatus: true, verificationStatus: true, reconciliationStatus: true, reversedAt: true, paidAt: true, createdAt: true, notes: true } }) : [],
    tab === "charges" ? prisma.rentCharge.findMany({ where: chargeWhere, ...paging, orderBy: [{ dueDate: "desc" }, { id: "desc" }], include: { lease: { select: { unit: { select: { houseNo: true } } } } } }) : [],
    tab === "activity" ? prisma.tenantActionLog.findMany({ where: actionWhere, ...paging, orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: { actor: { select: { fullName: true } }, unit: { select: { houseNo: true } } } }) : [],
    tab === "audit" ? prisma.auditLog.findMany({ where: auditWhere, ...paging, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, actor: { select: { fullName: true } } } }) : [],
  ]);
  return { org, session, tenant, tab, page, counts, paid: Number(paid._sum.amount ?? 0), outstanding: Number(outstanding._sum.balance ?? 0), leases, payments, charges, actions, audits };
}
