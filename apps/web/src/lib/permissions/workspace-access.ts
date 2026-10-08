import type { OrgRole, PlatformRole } from "@prisma/client";
import { tenantCanAccessWorkspacePath } from "./access";

const MANAGEMENT: readonly OrgRole[] = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"];
const OPERATIONS: readonly OrgRole[] = ["ADMIN", "MANAGER", "OFFICE"];
const FINANCE: readonly OrgRole[] = ["ADMIN", "MANAGER", "ACCOUNTANT"];

// Shared by server authorization and navigation. Unlisted sections are denied.
export const ORG_WORKSPACE_ROLES: Record<string, readonly OrgRole[]> = {
  insights: MANAGEMENT, profile: MANAGEMENT, help: MANAGEMENT, search: MANAGEMENT,
  security: MANAGEMENT, support: MANAGEMENT,
  properties: OPERATIONS, buildings: OPERATIONS, units: OPERATIONS,
  tenants: OPERATIONS, leases: OPERATIONS, "vacancy-inquiries": OPERATIONS,
  "finance-requests": OPERATIONS, "move-outs": OPERATIONS,
  inspections: OPERATIONS, issues: OPERATIONS, notifications: OPERATIONS,
  imports: OPERATIONS,
  payments: MANAGEMENT, "water-bills": MANAGEMENT, charges: MANAGEMENT,
  accounting: FINANCE, expenditures: FINANCE, reports: FINANCE,
  staff: ["ADMIN", "MANAGER"], taxes: ["ADMIN", "ACCOUNTANT"],
  airbnb: ["ADMIN", "MANAGER"],
  settings: ["ADMIN"], "verify-tenant": ["ADMIN"],
};

function under(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function canAccessWorkspacePath(
  session: { platformRole: PlatformRole; activeOrgRole: OrgRole | null; activeOrgId: string | null },
  pathname: string,
) {
  let path: string;
  try {
    path = new URL(pathname, "https://estatedesk.invalid").pathname.replace(/\/+$/, "");
  } catch {
    return false;
  }
  if (["/dashboard", "/profile", "/access-denied"].includes(path) || under(path, "/change-password")) return true;
  const platform = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole);
  if (under(path, "/platform")) return platform;
  if (path === "/api-keys") return platform || (Boolean(session.activeOrgId) && session.activeOrgRole === "ADMIN");
  if (!session.activeOrgId || !session.activeOrgRole) return false;
  const role = session.activeOrgRole;
  if (role === "TENANT") return tenantCanAccessWorkspacePath(path);
  if (under(path, "/dashboard/tenant")) return false;
  if (under(path, "/dashboard/caretaker")) return role === "CARETAKER";
  if (under(path, "/dashboard/landlord")) return role === "LANDLORD";
  if (!MANAGEMENT.includes(role)) return false;
  if (path === "/dashboard/org" || path === "/dashboard/billing-required") return true;
  const section = under(path, "/dashboard/org") ? path.split("/")[3] : path.split("/")[1];
  return Boolean(section && ORG_WORKSPACE_ROLES[section]?.includes(role));
}
