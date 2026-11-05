import type { OrgRolePolicy, OrgView } from "../permissions/org-role-policy";

export type OrgFeatureMap = Record<string, boolean>;

export function parseFeatureMap(value: unknown): OrgFeatureMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: OrgFeatureMap = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = Boolean(item);
  }
  return result;
}

export function getFeatureFlag(
  features: OrgFeatureMap,
  key: string,
  defaultValue = false,
) {
  if (key in features) return Boolean(features[key]);
  return defaultValue;
}

/** Sync helper when control state is already loaded. */
export function applyGlobalFeatureOverrides(
  orgFeatures: unknown,
  globalFeatures: Record<string, boolean>,
): OrgFeatureMap {
  const merged = parseFeatureMap(orgFeatures);
  for (const [key, value] of Object.entries(globalFeatures)) {
    merged[key] = Boolean(value);
  }
  return merged;
}

export function applyFeatureAccess(policy: OrgRolePolicy | undefined, features: OrgFeatureMap): OrgRolePolicy {
  const blocked = new Set<OrgView>(policy?.blockedViews ?? []);
  const featureViews: Record<string, OrgView[]> = {
    taxes: ["taxes"], waterBilling: ["water-bills", "meters"],
    inspections: ["inspections"], vacantHouses: ["vacancy-inquiries"],
  };
  for (const [key, views] of Object.entries(featureViews)) {
    if (features[key] === false) for (const view of views) blocked.add(view);
  }
  return { permissions: policy?.permissions ?? {}, blockedViews: [...blocked] };
}

export function featureBlocksPath(features: OrgFeatureMap | undefined, pathname: string): boolean {
  if (!features) return false;
  const path = new URL(pathname, "https://estatedesk.invalid").pathname;
  return features.tenantPortal === false && (
    path === "/dashboard/tenant" || path.startsWith("/dashboard/tenant/") ||
    path === "/api/mobile/tenant" || path.startsWith("/api/mobile/tenant/") ||
    path === "/api/tenant" || path.startsWith("/api/tenant/")
  );
}
