import "server-only";

import { getPlatformControl } from "@/lib/platform/control";
import { applyGlobalFeatureOverrides, type OrgFeatureMap } from "./features";

/** Resolve persisted platform overrides only on the server. */
export async function resolveOrgFeatures(orgFeatures: unknown): Promise<OrgFeatureMap> {
  const control = await getPlatformControl();
  return applyGlobalFeatureOverrides(orgFeatures, control.globalFeatures);
}
