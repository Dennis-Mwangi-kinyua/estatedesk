import type { MobileWorkspaceLink } from "@estatedesk/contracts/mobile";

export type ManagementMode = "organization" | "admin" | "developer";

/** Preserve the API-authorized unified catalogue, including for old mode callers. */
export function linksForManagementMode(links: MobileWorkspaceLink[], mode: ManagementMode) {
  void mode;
  return links;
}
