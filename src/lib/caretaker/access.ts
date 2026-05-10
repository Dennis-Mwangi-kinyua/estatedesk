import "server-only";

import type { ScopeType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type MembershipScope =
  | {
      scopeType: ScopeType;
      scopeId: string;
    }
  | null
  | undefined;

type GetCaretakerAllowedUnitIdsInput = {
  orgId: string;
  caretakerUserId: string;
  membershipScope?: MembershipScope;
};

function addScopedTarget(
  scope: MembershipScope,
  targets: {
    propertyIds: Set<string>;
    buildingIds: Set<string>;
    unitIds: Set<string>;
  },
) {
  if (!scope || scope.scopeId === "ORG_SCOPE") {
    return;
  }

  if (scope.scopeType === "PROPERTY") {
    targets.propertyIds.add(scope.scopeId);
  }

  if (scope.scopeType === "BUILDING") {
    targets.buildingIds.add(scope.scopeId);
  }

  if (scope.scopeType === "UNIT") {
    targets.unitIds.add(scope.scopeId);
  }
}

export async function getCaretakerAllowedUnitIds({
  orgId,
  caretakerUserId,
  membershipScope,
}: GetCaretakerAllowedUnitIdsInput) {
  const targets = {
    propertyIds: new Set<string>(),
    buildingIds: new Set<string>(),
    unitIds: new Set<string>(),
  };

  addScopedTarget(membershipScope, targets);

  const assignments = await prisma.caretakerAssignment.findMany({
    where: {
      orgId,
      caretakerUserId,
      active: true,
      endedAt: null,
    },
    select: {
      propertyId: true,
      buildingId: true,
      unitId: true,
    },
  });

  for (const assignment of assignments) {
    if (assignment.propertyId) {
      targets.propertyIds.add(assignment.propertyId);
    }

    if (assignment.buildingId) {
      targets.buildingIds.add(assignment.buildingId);
    }

    if (assignment.unitId) {
      targets.unitIds.add(assignment.unitId);
    }
  }

  const propertyIds = Array.from(targets.propertyIds);
  const buildingIds = Array.from(targets.buildingIds);
  const unitIds = Array.from(targets.unitIds);

  if (
    propertyIds.length === 0 &&
    buildingIds.length === 0 &&
    unitIds.length === 0
  ) {
    return [];
  }

  const units = await prisma.unit.findMany({
    where: {
      deletedAt: null,
      property: {
        orgId,
        deletedAt: null,
      },
      OR: [
        ...(unitIds.length > 0 ? [{ id: { in: unitIds } }] : []),
        ...(buildingIds.length > 0
          ? [{ buildingId: { in: buildingIds } }]
          : []),
        ...(propertyIds.length > 0
          ? [{ propertyId: { in: propertyIds } }]
          : []),
      ],
    },
    select: {
      id: true,
    },
  });

  return units.map((unit) => unit.id);
}
