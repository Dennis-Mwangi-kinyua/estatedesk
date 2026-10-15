import type { OrgRole, PlatformRole } from "@prisma/client";

export const ROLE_HOME_PATHS = {
  ADMIN: "/dashboard/org",
  MANAGER: "/dashboard/org",
  OFFICE: "/dashboard/org/tenants",
  ACCOUNTANT: "/dashboard/org/accounting",
  CARETAKER: "/dashboard/caretaker/today",
  TENANT: "/dashboard/tenant",
  LANDLORD: "/dashboard/landlord",
  SECURITY: "/dashboard/gate",
} satisfies Record<OrgRole, string>;

type RedirectInput = {
  platformRole: PlatformRole;
  activeOrgRole: OrgRole | null;
  activeOrgId: string | null;
  hasTenantProfile: boolean;
  hasServiceProvider?: boolean;
  preferredPlatformMode?: "admin" | "developer" | null;
};

/** One policy for login, dashboard entry, and workspace home links. */
export function getRedirectAfterLogin(input: RedirectInput): string {
  if (input.platformRole === "SUPER_ADMIN" || input.platformRole === "PLATFORM_ADMIN") {
    return input.preferredPlatformMode === "developer" ? "/platform/developer" : "/platform";
  }
  // A historical tenant profile must not override the user's active staff role.
  if (input.activeOrgRole) {
    if (!input.activeOrgId) return "/login?error=missing_org_context";
    return ROLE_HOME_PATHS[input.activeOrgRole];
  }
  if (input.hasTenantProfile) return "/dashboard/tenant";
  if (input.hasServiceProvider) return "/provider";
  return "/login?error=no_active_role";
}
