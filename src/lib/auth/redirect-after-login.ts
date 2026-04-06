import type { OrgRole, PlatformRole } from "@/lib/auth/session";

type RedirectInput = {
  platformRole: PlatformRole;
  activeOrgRole: OrgRole | null;
  activeOrgId: string | null;
  hasTenantProfile: boolean;
};

export function getRedirectAfterLogin(input: RedirectInput): string {
  const { platformRole, activeOrgRole, activeOrgId, hasTenantProfile } = input;

  if (platformRole === "SUPER_ADMIN" || platformRole === "PLATFORM_ADMIN") {
    return "/platform";
  }

  if (activeOrgRole === "TENANT" || hasTenantProfile) {
    return "/dashboard/tenant";
  }

  if (
    activeOrgRole === "CARETAKER" ||
    activeOrgRole === "ADMIN" ||
    activeOrgRole === "MANAGER" ||
    activeOrgRole === "OFFICE" ||
    activeOrgRole === "ACCOUNTANT"
  ) {
    if (!activeOrgId) {
      return "/login?error=missing_org_context";
    }

    if (activeOrgRole === "CARETAKER") {
      return "/dashboard/caretaker";
    }

    return "/dashboard/org";
  }

  return "/login?error=no_active_role";
}