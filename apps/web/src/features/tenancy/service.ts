import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createInitialLeaseCharges } from "@/lib/billing/initial-lease-charges";
export const reinstateSchema = z.object({ tenantId: z.string().min(1).max(100), unitId: z.string().min(1).max(100), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !Number.isNaN(Date.parse(value)), "Choose a valid start date."), dueDay: z.coerce.number().int().min(1).max(31), monthlyRent: z.coerce.number().positive().max(9999999999), deposit: z.coerce.number().nonnegative().max(9999999999) });
export async function reinstateTenant(orgId: string, actorUserId: string, input: z.input<typeof reinstateSchema>) {
  const data = reinstateSchema.parse(input);
  return prisma.$transaction(async tx => {
    const locked = await tx.tenant.updateMany({ where: { id: data.tenantId, orgId, deletedAt: null, status: { in: ["ACTIVE", "INACTIVE"] } }, data: { updatedAt: new Date() } });
    if (!locked.count) throw new Error("Tenant not found, archived or blacklisted. Resolve their account status before reinstating.");
    const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: data.tenantId }, include: { user: { select: { status: true, deletedAt: true } } } });
    if (tenant.user && (tenant.user.status !== "ACTIVE" || tenant.user.deletedAt)) throw new Error("This login is disabled. Restore it through account controls first.");
    if (await tx.lease.count({ where: { tenantId: data.tenantId, orgId, status: "ACTIVE", deletedAt: null } })) throw new Error("This tenant already has an active lease. Complete move-out before allocating a replacement unit.");
    const startDate = new Date(`${data.startDate}T00:00:00+03:00`);
    const latest = await tx.lease.findFirst({ where: { tenantId: data.tenantId, orgId, status: "TERMINATED", endDate: { not: null } }, orderBy: { endDate: "desc" }, select: { endDate: true } });
    if (latest?.endDate && startDate < latest.endDate) throw new Error("The new lease cannot begin before the previous tenancy ended.");
    const unitClaim = await tx.unit.updateMany({ where: { id: data.unitId, status: "VACANT", isActive: true, deletedAt: null, property: { orgId, deletedAt: null } }, data: { status: "OCCUPIED", vacantSince: null } });
    if (!unitClaim.count) throw new Error("This unit is unavailable or belongs to another organisation.");
    if (await tx.lease.count({ where: { unitId: data.unitId, status: "ACTIVE", deletedAt: null } })) throw new Error("This unit already has an active lease.");
    const lease = await tx.lease.create({ data: { orgId, tenantId: data.tenantId, unitId: data.unitId, startDate, dueDay: data.dueDay, monthlyRent: new Prisma.Decimal(data.monthlyRent), deposit: new Prisma.Decimal(data.deposit), status: "ACTIVE" } });
    await createInitialLeaseCharges(tx, lease);
    await tx.tenant.update({ where: { id: data.tenantId }, data: { status: "ACTIVE", archivedAt: null } });
    await tx.tenantActionLog.create({ data: { orgId, tenantId: data.tenantId, leaseId: lease.id, unitId: data.unitId, actorUserId, action: "RESTORED", notes: "Retained tenant reinstated with a new lease; previous records preserved." } });
    await tx.auditLog.create({ data: { orgId, actorUserId, action: "TENANT_REINSTATED", entityType: "Tenant", entityId: data.tenantId, metadata: { leaseId: lease.id, unitId: data.unitId } } });
    return lease;
  }, { timeout: 15000 });
}
export async function previousUnitOccupants(userId: string, orgId: string) {
  const lease = await prisma.lease.findFirst({ where: { orgId, status: "ACTIVE", deletedAt: null, tenant: { userId, orgId, deletedAt: null } }, orderBy: { createdAt: "desc" }, select: { tenantId: true, unitId: true, startDate: true } });
  if (!lease) return [];
  const previous = await prisma.lease.findMany({ where: { orgId, unitId: lease.unitId, status: "TERMINATED", deletedAt: null, tenantId: { not: lease.tenantId }, endDate: { not: null, lte: lease.startDate } }, orderBy: { endDate: "desc" }, select: { startDate: true, endDate: true, tenant: { select: { fullName: true } } } });
  // This projection is the complete response: no IDs, contact details or financial data.
  return previous.map(item => ({ name: item.tenant.fullName, durationDays: Math.max(1, Math.ceil((item.endDate!.getTime() - item.startDate.getTime()) / 86400000)) }));
}
