import type { OrgRole, PlatformRole } from "@/lib/auth/session";

type RedirectInput = {
  platformRole: PlatformRole;
  activeOrgRole: OrgRole | null;
  hasTenantProfile: boolean;
};

export function getRedirectAfterLogin(input: RedirectInput): string {
  const { platformRole, activeOrgRole, hasTenantProfile } = input;

  if (platformRole === "SUPER_ADMIN" || platformRole === "PLATFORM_ADMIN") {
    return "/platform";
  }

  // Do NOT send a successfully authenticated user back to /login
  if (!activeOrgRole) {
    return hasTenantProfile ? "/dashboard/tenant" : "/onboarding";
  }

  switch (activeOrgRole) {
    case "TENANT":
      return "/dashboard/tenant";

    case "CARETAKER":
      return "/dashboard/caretaker";

    case "ADMIN":
    case "MANAGER":
    case "OFFICE":
    case "ACCOUNTANT":
      return "/dashboard/org";

    default:
      return "/dashboard/org";
  }
}