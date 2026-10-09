export type InspectionMembership = { role: string; scopeType: string; scopeId: string; employmentEndedAt?: Date | null; deactivatedAt?: Date | null };
export function canInspectUnit(memberships: InspectionMembership[], unit: { id: string; propertyId: string; buildingId: string | null }) {
  return memberships.some(member => member.role !== "TENANT" && !member.employmentEndedAt && !member.deactivatedAt && (
    member.scopeType === "ORG" ||
    (member.scopeType === "PROPERTY" && member.scopeId === unit.propertyId) ||
    (member.scopeType === "BUILDING" && member.scopeId === unit.buildingId) ||
    (member.scopeType === "UNIT" && member.scopeId === unit.id)
  ));
}
