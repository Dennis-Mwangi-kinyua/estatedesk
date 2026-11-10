import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import { approvalPaths, canAccessApprovalKind, assertManagementSession, dateInput, endOfDay, performanceMetrics, promiseProgress, startOfDay } from "./policy";
import { activeStaff, leaseWhere } from "./service";
import { nairobiDayStart } from "@/lib/billing/period-dates";

export const pageNumber = (value?: string) => Math.max(1, Math.min(10000, Math.trunc(Number(value) || 1)));
export const dateLabel = (value: Date | null) => value ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(value) : "—";
export async function staffOptions(orgId: string, includeInactive = false) {
  return prisma.membership.findMany({ where: includeInactive ? { orgId, scopeType: "ORG", role: { in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"] } } : activeStaff(orgId), select: { userId: true, role: true, user: { select: { fullName: true } } }, distinct: ["userId"], orderBy: { user: { fullName: "asc" } }, take: 100 });
}
export async function approvalData(session: AppSession, page: number, search = "", status = "PENDING") {
  const orgId = assertManagementSession(session, "approvals");
  const where: Prisma.OrgManagementApprovalWhereInput = { orgId, kind: { in: Object.keys(approvalPaths).filter(k => canAccessApprovalKind(session, k)) }, ...(status === "ALL" ? {} : { status }), ...(search ? { reason: { contains: search.slice(0, 100), mode: "insensitive" } } : {}) };
  const [requests, total, policy, leases, charges, expenses, members, refunds, financeCount] = await Promise.all([
    prisma.orgManagementApproval.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 25 }),
    prisma.orgManagementApproval.count({ where }), prisma.orgManagementPolicy.findUnique({ where: { orgId } }),
    prisma.lease.findMany({ where: { ...leaseWhere(orgId), ...(search ? { tenant: { fullName: { contains: search, mode: "insensitive" }, deletedAt: null } } : {}) }, select: { id: true, monthlyRent: true, tenant: { select: { fullName: true } }, unit: { select: { houseNo: true } } }, take: 50, orderBy: { tenant: { fullName: "asc" } } }),
    prisma.rentCharge.findMany({ where: { orgId, balance: { gt: 0 }, lease: { ...leaseWhere(orgId), ...(search ? { tenant: { fullName: { contains: search, mode: "insensitive" } } } : {}) } }, select: { id: true, period: true, balance: true, chargeType: true, lease: { select: { tenant: { select: { fullName: true } } } } }, take: 50, orderBy: { dueDate: "asc" } }),
    prisma.expenditure.findMany({ where: { orgId, scope: "ORGANIZATION", status: "PENDING_APPROVAL", ...(search ? { description: { contains: search, mode: "insensitive" } } : {}) }, select: { id: true, amount: true, description: true }, take: 50, orderBy: { createdAt: "asc" } }),
    prisma.membership.findMany({ where: { orgId, employmentEndedAt: null, deactivatedAt: null, role: { in: ["MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "SECURITY"] }, ...(search ? { user: { fullName: { contains: search, mode: "insensitive" } } } : {}) }, select: { id: true, role: true, user: { select: { fullName: true } } }, take: 50, orderBy: { user: { fullName: "asc" } } }),
    prisma.moveOutNotice.findMany({ where: { lease: { orgId, deletedAt: null }, closeout: { path: ["refundStatus"], equals: "PENDING" } }, select: { id: true, closeout: true, tenant: { select: { fullName: true } } }, take: 50, orderBy: { noticeDate: "asc" } }),
    prisma.accountingRequest.count({ where: { orgId, status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
  ]);
  const users = await prisma.user.findMany({ where: { id: { in: [...new Set(requests.flatMap(v => [v.requestedByUserId, ...(v.reviewedByUserId ? [v.reviewedByUserId] : [])]))] } }, select: { id: true, fullName: true } });
  return { requests, total, policy, leases: canAccessApprovalKind(session, "RENT_CHANGE") ? leases : [], charges: canAccessApprovalKind(session, "WRITE_OFF") ? charges : [], expenses: canAccessApprovalKind(session, "EXPENSE") ? expenses : [], members: canAccessApprovalKind(session, "STAFF_ACCESS") ? members : [], refunds: canAccessApprovalKind(session, "REFUND") ? refunds : [], financeCount, users };
}
export async function collectionData(session: AppSession, page: number, search = "", filter = "OPEN") {
  const orgId = assertManagementSession(session, "collections");
  const where: Prisma.CollectionPromiseWhereInput = { orgId, ...(filter === "ALL" ? {} : { status: filter === "OVERDUE" ? "OPEN" : filter }), ...(filter === "OVERDUE" ? { dueAt: { lt: new Date() } } : {}) };
  const leases = await prisma.lease.findMany({ where: { ...leaseWhere(orgId), rentCharges: { some: { orgId, balance: { gt: 0 }, dueDate: { lt: nairobiDayStart() } } }, ...(search ? { tenant: { fullName: { contains: search.slice(0, 100), mode: "insensitive" }, deletedAt: null } } : {}) }, select: { id: true, tenant: { select: { fullName: true } }, unit: { select: { houseNo: true } } }, take: 50, orderBy: { tenant: { fullName: "asc" } } });
  if (search) where.leaseId = { in: leases.map(v => v.id) };
  const [promises, total, staff] = await Promise.all([prisma.collectionPromise.findMany({ where, skip: (page - 1) * 25, take: 25, orderBy: [{ followUpAt: "asc" }, { id: "asc" }] }), prisma.collectionPromise.count({ where }), staffOptions(orgId)]);
  const leaseIds = [...new Set(promises.map(v => v.leaseId))];
  const [sources, paid] = await Promise.all([
    prisma.lease.findMany({ where: { orgId, id: { in: leaseIds } }, select: { id: true, tenant: { select: { fullName: true } }, unit: { select: { houseNo: true } } } }),
    prisma.rentCharge.groupBy({ by: ["leaseId"], where: { orgId, leaseId: { in: leaseIds } }, _sum: { amountPaid: true } }),
  ]);
  return { total, leases, staff, sources, promises: promises.map(v => ({ ...v, progress: promiseProgress(Number(v.amount), Number(v.baselinePaid), Number(paid.find(p => p.leaseId === v.leaseId)?._sum.amountPaid ?? 0), v.dueAt) })) };
}
export async function renewalData(session: AppSession, page: number, days: number, search = "") {
  const orgId = assertManagementSession(session, "renewals");
  const until = new Date(Date.now() + days * 86400000);
  const where: Prisma.LeaseWhereInput = { ...leaseWhere(orgId), endDate: { lte: until, not: null }, ...(search ? { tenant: { fullName: { contains: search.slice(0, 100), mode: "insensitive" }, deletedAt: null } } : {}) };
  const [leases, total, offers] = await Promise.all([
    prisma.lease.findMany({ where, select: { id: true, endDate: true, monthlyRent: true, tenant: { select: { fullName: true, userId: true } }, unit: { select: { houseNo: true } } }, orderBy: [{ endDate: "asc" }, { id: "asc" }], skip: (page - 1) * 25, take: 25 }),
    prisma.lease.count({ where }), prisma.leaseRenewal.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const offerLeases = await prisma.lease.findMany({ where: { orgId, id: { in: offers.map(v => v.leaseId) } }, select: { id: true, tenant: { select: { fullName: true } } } });
  return { leases, total, offers, offerLeases };
}
export async function activityData(session: AppSession, page: number, search: string, actor: string, from: string, to: string) {
  const orgId = assertManagementSession(session, "activity");
  const where: Prisma.AuditLogWhereInput = { orgId, ...(actor ? { actorUserId: actor } : {}), ...(search ? { OR: [{ action: { contains: search.slice(0, 100), mode: "insensitive" } }, { entityType: { contains: search.slice(0, 100), mode: "insensitive" } }, { entityId: { contains: search.slice(0, 100) } }] } : {}), ...((from || to) ? { createdAt: { ...(dateInput.safeParse(from).success ? { gte: startOfDay(from) } : {}), ...(dateInput.safeParse(to).success ? { lte: endOfDay(to) } : {}) } } : {}) };
  const [logs, total, staff] = await Promise.all([prisma.auditLog.findMany({ where, select: { id: true, actor: { select: { fullName: true } }, action: true, entityType: true, entityId: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 25 }), prisma.auditLog.count({ where }), staffOptions(orgId, true)]);
  return { logs, total, staff };
}
export async function handoverData(session: AppSession, page: number) {
  const orgId = assertManagementSession(session, "handovers");
  const [handovers, total, staff] = await Promise.all([prisma.staffHandover.findMany({ where: { orgId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 25, take: 25 }), prisma.staffHandover.count({ where: { orgId } }), staffOptions(orgId, true)]);
  return { handovers, total, staff };
}
type PerformanceRow = { id: string; name: string; charged: Prisma.Decimal; collected: Prisma.Decimal; costs: Prisma.Decimal; maintenanceCosts: Prisma.Decimal; arrears: Prisma.Decimal; units: number; vacant: number; occupied: number; vacancyDays: number | null };
export async function propertyPerformance(session: AppSession, period: string, page: number) {
  const orgId = assertManagementSession(session, "performance");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error("Choose a valid reporting month.");
  const start = startOfDay(`${period}-01`);
  const [year, month] = period.split("-").map(Number);
  const end = new Date(Date.UTC(year, month, 1, -3));
  const rows = await prisma.$queryRaw<PerformanceRow[]>`
    WITH charges AS (
      SELECT u."propertyId", SUM(c."amountDue") AS charged, SUM(c."amountPaid") AS collected
      FROM "RentCharge" c JOIN "Lease" l ON l.id=c."leaseId" JOIN "Unit" u ON u.id=l."unitId"
      WHERE c."orgId"=${orgId} AND l."orgId"=${orgId} AND c.period=${period} AND c."chargeType"='RENT'
      GROUP BY u."propertyId"
    ), arrears AS (
      SELECT u."propertyId", SUM(c.balance) AS arrears FROM "RentCharge" c
      JOIN "Lease" l ON l.id=c."leaseId" JOIN "Unit" u ON u.id=l."unitId"
      WHERE c."orgId"=${orgId} AND l."orgId"=${orgId} AND c."dueDate"<${nairobiDayStart()} AND c.balance>0 GROUP BY u."propertyId"
    ), costs AS (
      SELECT "propertyId", SUM(amount) AS costs, SUM(amount) FILTER (WHERE category IN ('MAINTENANCE','TENANT_REPAIR')) AS "maintenanceCosts" FROM "Expenditure"
      WHERE "orgId"=${orgId} AND scope='ORGANIZATION' AND status='PAID' AND "incurredAt">=${start} AND "incurredAt"<${end}
      AND "currencyCode"=(SELECT "currencyCode" FROM "Organization" WHERE id=${orgId}) GROUP BY "propertyId"
    ), units AS (
      SELECT "propertyId", COUNT(*)::int AS units, COUNT(*) FILTER (WHERE status='VACANT')::int AS vacant, COUNT(*) FILTER (WHERE status='OCCUPIED')::int AS occupied,
      AVG(GREATEST(0, EXTRACT(EPOCH FROM (NOW()-"vacantSince"))/86400)) FILTER (WHERE status='VACANT')::float AS "vacancyDays"
      FROM "Unit" WHERE "deletedAt" IS NULL AND "isActive"=true AND "propertyId" IN (SELECT id FROM "Property" WHERE "orgId"=${orgId}) GROUP BY "propertyId"
    )
    SELECT p.id,p.name,COALESCE(c.charged,0) AS charged,COALESCE(c.collected,0) AS collected,
      COALESCE(x.costs,0) AS costs,COALESCE(x."maintenanceCosts",0) AS "maintenanceCosts",COALESCE(a.arrears,0) AS arrears,
      COALESCE(u.units,0)::int AS units,COALESCE(u.vacant,0)::int AS vacant,COALESCE(u.occupied,0)::int AS occupied,u."vacancyDays"
    FROM "Property" p LEFT JOIN charges c ON c."propertyId"=p.id LEFT JOIN costs x ON x."propertyId"=p.id
    LEFT JOIN arrears a ON a."propertyId"=p.id LEFT JOIN units u ON u."propertyId"=p.id
    WHERE p."orgId"=${orgId} AND p."deletedAt" IS NULL ORDER BY p.name,p.id LIMIT 25 OFFSET ${(page - 1) * 25}`;
  const total = await prisma.property.count({ where: { orgId, deletedAt: null } });
  return { total, rows: rows.map(v => ({ ...v, ...performanceMetrics(Number(v.charged), Number(v.collected), Number(v.costs), Number(v.arrears), v.units, v.vacant, v.occupied) })) };
}
