import type { Prisma } from "@prisma/client";

type Scope = { scopeType: string; scopeId: string } | null | undefined;

/** Use the same unit boundary for every native portfolio resource. */
export function nativeUnitScope(orgId: string, scope: Scope): Prisma.UnitWhereInput {
  return { deletedAt: null, property: { orgId, deletedAt: null },
    ...(scope?.scopeType === "PROPERTY" ? { propertyId: scope.scopeId }
      : scope?.scopeType === "BUILDING" ? { buildingId: scope.scopeId }
      : scope?.scopeType === "UNIT" ? { id: scope.scopeId }
      : scope && scope.scopeType !== "ORG" ? { id: { in: [] } } : {}),
  };
}

export function nativeWorkspaceEntry<T extends { path: string }>(links: T[], path: string) {
  // Exact menu membership is required; no arbitrary detail paths or redirects.
  return links.find(link => link.path === path) ?? null;
}

export function nativeOrgWideAccess(scope: Scope) {
  return !scope || scope.scopeType === "ORG";
}
