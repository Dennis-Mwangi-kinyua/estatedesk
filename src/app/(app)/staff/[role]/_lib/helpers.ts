import { formatDateTime, formatRelative } from "@/app/(app)/staff/_lib/helpers";

export { formatDateTime, formatRelative };

type AssignmentInput = {
  isPrimary: boolean;
  property: { name: string } | null;
  building: { name: string; property: { name: string } | null } | null;
  unit: {
    houseNo: string;
    property: { name: string } | null;
    building: { name: string } | null;
  } | null;
};

export function formatAssignmentLabel(assignment: AssignmentInput) {
  if (assignment.unit) {
    return [
      assignment.unit.property?.name,
      assignment.unit.building?.name,
      `Unit ${assignment.unit.houseNo}`,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (assignment.building) {
    return [
      assignment.building.property?.name ?? "Property",
      assignment.building.name,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (assignment.property) {
    return assignment.property.name;
  }

  return "Unassigned";
}

export function summarizeAssignments(assignments: AssignmentInput[]) {
  if (assignments.length === 0) {
    return "No assignment";
  }

  const primary =
    assignments.find((assignment) => assignment.isPrimary) ?? assignments[0];

  if (assignments.length === 1) {
    return formatAssignmentLabel(primary);
  }

  return `${formatAssignmentLabel(primary)} +${assignments.length - 1} more`;
}