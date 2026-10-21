import "server-only";
import { prisma } from "@/lib/prisma";
import { canViewWholeProperty, scopedPropertyWhere, scopedUnitWhere, type RecordScope } from "./record-scope";

export async function scopedExpenditureWhere(orgId: string, scope: RecordScope) {
  if (scope?.scopeType === "ORG") return { orgId };
  const unitWhere = scopedUnitWhere(orgId, scope);
  const [properties, units] = await Promise.all([
    canViewWholeProperty(scope) ? prisma.property.findMany({ where: scopedPropertyWhere(orgId, scope), select: { id: true } }) : Promise.resolve([]),
    prisma.unit.findMany({ where: unitWhere, select: { id: true } }),
  ]);
  return {
    orgId,
    OR: [
      ...(properties.length ? [{ propertyId: { in: properties.map(({ id }) => id) } }] : []),
      ...(units.length ? [{ unitId: { in: units.map(({ id }) => id) } }] : []),
      { tenant: { leases: { some: { deletedAt: null, unit: unitWhere } } } },
    ],
  };
}
