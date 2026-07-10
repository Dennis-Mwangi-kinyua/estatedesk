import type { OrgRole, PlatformRole } from "@prisma/client";

type RedirectInput = {
  platformRole: PlatformRole;
  activeOrgRole: OrgRole | null;
  activeOrgId: string | null;
  hasTenantProfile: boolean;
  /** Restored from the platform mode cookie when present. */
  preferredPlatformMode?: "admin" | "developer" | null;
};

export function getRedirectAfterLogin(input: RedirectInput): string {
  const {
    platformRole,
    activeOrgRole,
    activeOrgId,
    hasTenantProfile,
    preferredPlatformMode,
  } = input;

  if (platformRole === "SUPER_ADMIN" || platformRole === "PLATFORM_ADMIN") {
    return preferredPlatformMode === "developer"
      ? "/platform/developer"
      : "/platform";
  }

  if (activeOrgRole === "TENANT" || hasTenantProfile) {
    return "/dashboard/tenant";
  }

  if (activeOrgRole === "LANDLORD") {
    return "/dashboard/landlord";
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