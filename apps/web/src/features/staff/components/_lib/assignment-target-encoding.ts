import type { AssignmentTargetType } from "./types";

export function encodeAssignmentTargetValue(target: {
  type: AssignmentTargetType;
  id: string;
}) {
  return `${target.type}:${target.id}`;
}

export function decodeAssignmentTargetValue(
  value: string,
): { type: AssignmentTargetType; id: string } | null {
  const [type, ...idParts] = value.split(":");

  if (
    (type !== "PROPERTY" && type !== "BUILDING") ||
    idParts.length === 0
  ) {
    return null;
  }

  return {
    type,
    id: idParts.join(":"),
  };
}