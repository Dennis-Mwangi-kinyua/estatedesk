/** Parent IDs describe location; only the most specific target grants access. */
export function caretakerAssignmentTargets(assignments: ReadonlyArray<{ propertyId: string | null; buildingId: string | null; unitId: string | null }>) {
  const propertyIds = new Set<string>(), buildingIds = new Set<string>(), unitIds = new Set<string>();
  for (const assignment of assignments) {
    if (assignment.unitId) unitIds.add(assignment.unitId);
    else if (assignment.buildingId) buildingIds.add(assignment.buildingId);
    else if (assignment.propertyId) propertyIds.add(assignment.propertyId);
  }
  return { propertyIds: [...propertyIds], buildingIds: [...buildingIds], unitIds: [...unitIds] };
}
