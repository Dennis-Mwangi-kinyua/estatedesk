import type { Prisma } from "@prisma/client";
export type RecordScope = { scopeType: string; scopeId: string } | null | undefined;
export function canViewWholeProperty(scope: RecordScope) {
  return scope?.scopeType === "ORG" || scope?.scopeType === "PROPERTY";
}
export function scopedPropertyWhere(orgId: string, scope: RecordScope): Prisma.PropertyWhereInput {
  const base = { orgId, deletedAt: null };
  if (!scope) return { ...base, id: { in: [] } };
  switch (scope.scopeType) {
    case "ORG": return base;
    case "PROPERTY": return { ...base, id: scope.scopeId };
    case "BUILDING": return { ...base, buildings: { some: { id: scope.scopeId, deletedAt: null } } };
    case "UNIT": return { ...base, units: { some: { id: scope.scopeId, deletedAt: null } } };
    default: return { ...base, id: { in: [] } };
  }
}
export function scopedUnitWhere(orgId: string, scope: RecordScope): Prisma.UnitWhereInput {
  const base = { deletedAt: null, property: { orgId, deletedAt: null } };
  if (!scope) return { ...base, id: { in: [] } };
  switch (scope.scopeType) {
    case "ORG": return base;
    case "PROPERTY": return { ...base, propertyId: scope.scopeId };
    case "BUILDING": return { ...base, buildingId: scope.scopeId };
    case "UNIT": return { ...base, id: scope.scopeId };
    default: return { ...base, id: { in: [] } };
  }
}
export function scopedBuildingWhere(orgId: string, scope: RecordScope): Prisma.BuildingWhereInput {
  const base = { deletedAt: null, property: { orgId, deletedAt: null } };
  if (!scope) return { ...base, id: { in: [] } };
  switch (scope.scopeType) {
    case "ORG": return base;
    case "PROPERTY": return { ...base, propertyId: scope.scopeId };
    case "BUILDING": return { ...base, id: scope.scopeId };
    default: return { ...base, id: { in: [] } };
  }
}
export function scopedPaymentWhere(orgId: string, scope: RecordScope): Prisma.PaymentWhereInput {
  if (scope?.scopeType === "ORG") return { orgId };
  const lease = { orgId, deletedAt: null, unit: scopedUnitWhere(orgId, scope) };
  // Reject mixed allocations so a receipt cannot reveal another property's charges.
  return { orgId, AND: [
    { OR: [{ rentCharge: { lease } }, { waterBill: { unit: scopedUnitWhere(orgId, scope) } }, { allocations: { some: { rentCharge: { lease } } } }] },
    { OR: [{ rentChargeId: null }, { rentCharge: { lease } }] },
    { OR: [{ waterBillId: null }, { waterBill: { unit: scopedUnitWhere(orgId, scope) } }] },
    { allocations: { none: { NOT: { rentCharge: { lease } } } } },
    { taxChargeId: null },
  ] };
}
export function scopedIssueWhere(orgId: string, scope: RecordScope): Prisma.IssueTicketWhereInput {
  const unit = scopedUnitWhere(orgId, scope);
  if (scope?.scopeType === "ORG") return { orgId };
  if (scope?.scopeType === "PROPERTY") return { orgId, OR: [{ propertyId: scope.scopeId }, { unit: { is: unit } }] };
  return { orgId, unit: { is: unit } };
}
