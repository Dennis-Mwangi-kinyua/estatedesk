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

/**
 * Merge organization feature flags with platform-wide global overrides.
 * Global force ON/OFF wins over org settings.
 */
export async function resolveOrgFeatures(orgFeatures: unknown): Promise<OrgFeatureMap> {
  const { getPlatformControl } = await import("@/lib/platform/control");
  const control = await getPlatformControl();
  return applyGlobalFeatureOverrides(orgFeatures, control.globalFeatures);
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
