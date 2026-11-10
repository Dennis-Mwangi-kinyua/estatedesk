import "server-only";

import { prisma } from "@/lib/prisma";
import { buildSetupSteps, type SetupCounts } from "@/lib/workflow/setup-progress";

export async function loadSetupProgress(orgId: string) {
  const propertyWhere = { orgId, deletedAt: null };
  const unitWhere = { deletedAt: null, property: propertyWhere };
  const [
    properties,
    buildings,
    units,
    tenants,
    leases,
    rentCharges,
    meterReadings,
    tenantLogins,
    staffUsers,
    invitations,
    firstUnit,
    subscription,
  ] = await Promise.all([
    prisma.property.count({ where: propertyWhere }),
    prisma.building.count({ where: { deletedAt: null, property: propertyWhere } }),
    prisma.unit.count({ where: unitWhere }),
    prisma.tenant.count({ where: { orgId, deletedAt: null } }),
    prisma.lease.count({ where: { orgId, deletedAt: null } }),
    prisma.rentCharge.count({ where: { orgId, chargeType: "RENT" } }),
    prisma.meterReading.count({ where: { unit: unitWhere } }),
    prisma.tenant.count({ where: { orgId, deletedAt: null, userId: { not: null }, user: { status: "ACTIVE", deletedAt: null } } }),
    prisma.membership.groupBy({ by: ["userId"], where: { orgId, employmentEndedAt: null, deactivatedAt: null, role: { in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "SECURITY"] }, user: { status: "ACTIVE", deletedAt: null } } }),
    prisma.invitation.count({ where: { orgId, status: "PENDING", expiresAt: { gt: new Date() }, role: { in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "SECURITY"] } } }),
    prisma.unit.findFirst({
      where: { ...unitWhere, isActive: true, status: "VACANT", leases: { none: { status: "ACTIVE", deletedAt: null } } },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    }),
    prisma.subscription.findUnique({ where: { orgId }, select: { plan: true } }),
  ]);
  const counts: SetupCounts = {
    properties,
    buildings,
    units,
    tenants,
    leases,
    rentCharges,
    meterReadings,
    tenantLogins,
    staffMemberships: staffUsers.length,
    invitations,
  };
  const free = subscription?.plan === "FREE";
  return { counts, plan: subscription?.plan ?? "FREE", ...buildSetupSteps(counts, firstUnit?.id ?? null, { free }) };
}
