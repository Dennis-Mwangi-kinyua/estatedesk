import "server-only";
import { prisma } from "@/lib/prisma";

/** Visitor invitations require a working security login at the tenant's property. */
export async function hasActiveSecurityGate(orgId: string, propertyId: string) {
  const members = await prisma.membership.findMany({
    where: { orgId, role: "SECURITY", deactivatedAt: null, employmentEndedAt: null, user: { status: "ACTIVE", deletedAt: null } },
    select: { userId: true },
  });
  if (!members.length) return false;
  return Boolean(await prisma.gateAssignment.findFirst({ where: { orgId, propertyId, userId: { in: members.map(member => member.userId) } }, select: { id: true } }));
}

export async function getTenantVisitorAccess(orgId: string, userId: string) {
  const lease = await prisma.lease.findFirst({
    where: { orgId, tenant: { userId, deletedAt: null }, status: "ACTIVE", deletedAt: null, unit: { property: { deletedAt: null } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, unit: { select: { propertyId: true } } },
  });
  return Boolean(lease && await hasActiveSecurityGate(orgId, lease.unit.propertyId));
}
