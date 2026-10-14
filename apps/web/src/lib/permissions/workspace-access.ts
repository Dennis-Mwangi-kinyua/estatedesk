import { caretakerCanAccessPath } from "../caretaker/workspace-policy";
import type { OrgRole, PlatformRole } from "@prisma/client";
import { canReceiveOrgMandates, type OrgPermission } from "./role-matrix";
import { tenantCanAccessWorkspacePath } from "./access";

const MANAGEMENT: readonly OrgRole[] = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"];
const OPERATIONS: readonly OrgRole[] = ["ADMIN", "MANAGER", "OFFICE"];
const FINANCE: readonly OrgRole[] = ["ADMIN", "MANAGER", "ACCOUNTANT"];

// Shared by server authorization and navigation. Unlisted sections are denied.
export const ORG_WORKSPACE_ROLES: Record<string, readonly OrgRole[]> = {
  "identity-verification": OPERATIONS,
  "service-providers": OPERATIONS,
  community: OPERATIONS,
  insights: MANAGEMENT, profile: MANAGEMENT, help: MANAGEMENT, search: MANAGEMENT,
  security: MANAGEMENT, support: MANAGEMENT,
  properties: OPERATIONS, buildings: OPERATIONS, units: OPERATIONS,
  tenants: OPERATIONS, leases: OPERATIONS, "vacancy-inquiries": OPERATIONS,
  "finance-requests": OPERATIONS, "move-outs": MANAGEMENT,
  inspections: OPERATIONS, issues: OPERATIONS, notifications: MANAGEMENT,
  imports: OPERATIONS,
  payments: MANAGEMENT, "water-bills": MANAGEMENT, charges: MANAGEMENT,
  accounting: FINANCE, expenditures: FINANCE, reports: MANAGEMENT,
  staff: ["ADMIN", "MANAGER"], taxes: ["ADMIN", "ACCOUNTANT"],
  airbnb: ["ADMIN", "MANAGER"],
  settings: ["ADMIN"], "verify-tenant": ["ADMIN"],
};

function under(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function canAccessWorkspacePath(
  session: { platformRole: PlatformRole; activeOrgRole: OrgRole | null; activeOrgId: string | null; grantedPermissions?: readonly string[]; caretakerSections?: readonly string[]; caretakerUnitPaths?: readonly string[] },
  pathname: string,
) {
  let path: string;
  try {
    path = new URL(pathname, "https://estatedesk.invalid").pathname.replace(/\/+$/, "");
  } catch {
    return false;
  }
  // Provider ownership and hiring are authorised by their resource guards.
  if (path === "/provider" || path === "/service-providers" || /^\/service-providers\/[^/]+$/.test(path)) return true;
  if (["/dashboard", "/profile", "/access-denied"].includes(path) || under(path, "/change-password")) return true;
  const platform = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole);
  if (under(path, "/platform/control")) return session.platformRole === "SUPER_ADMIN";
  if (under(path, "/platform")) return platform;
  if (path === "/api-keys") return platform || (Boolean(session.activeOrgId) && session.activeOrgRole === "ADMIN");
  if (!session.activeOrgId || !session.activeOrgRole) return false;
  const role = session.activeOrgRole;
  if (role === "SECURITY") return under(path, "/dashboard/gate") || under(path, "/dashboard/security");
  if (/^\/inspections\/[^/]+$/.test(path)) return role !== "TENANT";
  if (under(path, "/dashboard/gate")) return ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"].includes(role);
  if (role === "TENANT") return tenantCanAccessWorkspacePath(path);
  if (under(path, "/dashboard/tenant")) return false;
  if (under(path, "/dashboard/caretaker")) return role === "CARETAKER" && caretakerCanAccessPath(path, session.caretakerSections);
  if (under(path, "/dashboard/landlord")) return role === "LANDLORD";
  if (!MANAGEMENT.includes(role)) return false;
  if (path === "/dashboard/org" || path === "/dashboard/billing-required") return true;
  if (under(path, "/dashboard/org/staff/permissions")) return role === "ADMIN";
  const section = under(path, "/dashboard/org") ? path.split("/")[3] : path.split("/")[1];
  if (section && ORG_WORKSPACE_ROLES[section]?.includes(role)) return true;
  if (!canReceiveOrgMandates(role)) return false;
  const grants = session.grantedPermissions ?? [];
  if (under(path, "/dashboard/org/accounting/requests")) return grants.includes("finance.requests.review");
  const sectionPermissions: Record<string, readonly OrgPermission[]> = {
    settings: ["org.settings.manage"], staff: ["org.users.manage", "org.users.delete"],
    properties: ["properties.manage"], buildings: ["properties.manage"], units: ["properties.manage"],
    tenants: ["tenants.manage"], leases: ["leases.manage"], reports: ["reports.view", "reports.export"],
    issues: ["maintenance.manage"], inspections: ["inspections.manage"],
  };
  return !!sectionPermissions[section]?.some(permission => grants.includes(permission));
}

/** Hide protected destinations using the same policy as page authorization. */
export function canDiscoverWorkspaceHref(session: Parameters<typeof canAccessWorkspacePath>[0], href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return true;
  const path = new URL(href, "https://estatedesk.invalid").pathname;
  if (session.activeOrgRole === "CARETAKER" && session.caretakerUnitPaths && path.startsWith("/dashboard/caretaker/units/")) {
    if (!session.caretakerUnitPaths.includes(path)) return false;
  }
  const section = path.split("/")[1];
  const protectedDestination = ["dashboard", "platform", "api-keys", "profile", "inspections"].includes(section) || section in ORG_WORKSPACE_ROLES;
  return !protectedDestination || canAccessWorkspacePath(session, href);
}
