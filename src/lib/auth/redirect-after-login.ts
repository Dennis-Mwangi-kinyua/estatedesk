import type { OrgRole, PlatformRole, ScopeType } from "@/lib/auth/session";

type LoginMembership = {
  orgId: string;
  orgSlug: string;
  orgStatus: string;
  role: OrgRole;
  scopeType: ScopeType;
  scopeId: string;
};

type RedirectInput = {
  platformRole: PlatformRole;
  memberships: LoginMembership[];
  hasTenantProfile: boolean;
};

export function getRedirectAfterLogin(input: RedirectInput): string {
  const { platformRole, memberships, hasTenantProfile } = input;

  if (platformRole === "SUPER_ADMIN" || platformRole === "PLATFORM_ADMIN") {
    return "/platform";
  }

  if (memberships.length === 0) {
    return hasTenantProfile ? "/dashboard/tenant" : "/login";
  }

  const sorted = [...memberships].sort((a, b) => {
    const rank: Record<OrgRole, number> = {
      ADMIN: 1,
      MANAGER: 2,
      OFFICE: 3,
      ACCOUNTANT: 4,
      CARETAKER: 5,
      TENANT: 6,
    };

    return rank[a.role] - rank[b.role];
  });

  const primary = sorted[0];

  switch (primary.role) {
    case "ADMIN":
    case "MANAGER":
    case "OFFICE":
    case "ACCOUNTANT":
      return "/dashboard";

    case "CARETAKER":
      return "/dashboard/caretaker";

    case "TENANT":
      return "/dashboard/tenant";

    default:
      return "/dashboard";
  }
}