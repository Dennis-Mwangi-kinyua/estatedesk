import "server-only";
import { prisma } from "@/lib/prisma";
export async function admitVisitor(input: { orgId: string; userId: string; manager: boolean; passId: string }, now = new Date()) {
  return prisma.$transaction(async tx => {
    const pass = await tx.visitorPass.findFirst({ where: { id: input.passId, orgId: input.orgId } });
    if (!pass) return false;
    if (!input.manager && !await tx.gateAssignment.findUnique({ where: { orgId_userId_propertyId: { orgId: input.orgId, userId: input.userId, propertyId: pass.propertyId } } })) return false;
    const lease = await tx.lease.findFirst({ where: { id: pass.leaseId, orgId: input.orgId, tenant: { userId: pass.tenantUserId, deletedAt: null }, unit: { propertyId: pass.propertyId, property: { deletedAt: null } }, status: "ACTIVE", deletedAt: null } });
    if (!lease) return false;
    return (await tx.visitorPass.updateMany({ where: { id: pass.id, orgId: input.orgId, revokedAt: null, admittedAt: null, validFrom: { lte: now }, validUntil: { gt: now } }, data: { admittedAt: now, admittedByUserId: input.userId } })).count === 1;
  });
}
