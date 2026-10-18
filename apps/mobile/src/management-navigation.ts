import type { MobileWorkspaceLink } from "@estatedesk/contracts/mobile";

export type ManagementMode = "organization" | "admin" | "developer";
const developerOnly = new Set(["developer", "developer/docs", "control", "system-health", "api-explorer", "api-keys", "feature-flags", "jobs", "rate-limits", "data-management", "backups"]);
const adminOnly = new Set(["", "search", "payments", "expenditures", "payment-ops", "onboarding", "marketing", "messages", "reports"]);

/** Presentation only: the API has already authorized every returned destination. */
export function linksForManagementMode(links: MobileWorkspaceLink[], mode: ManagementMode) {
  if (mode === "organization") return links;
  return links.filter(link => {
    const route = link.path.replace(/^\/platform\/?/, "");
    return mode === "admin" ? !developerOnly.has(route) && !route.startsWith("jobs/") : !adminOnly.has(route);
  });
}
