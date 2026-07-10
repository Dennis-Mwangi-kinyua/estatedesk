import type { OrgRole, PlatformRole } from "@/lib/auth/session";

const TENANT_HISTORY_ONLY_PATHS = new Set([
  "/dashboard/tenant",
  "/dashboard/tenant/profile",
]);

export function hasPlatformRole(
  userRole: PlatformRole,
  allowedRoles: readonly PlatformRole[],
) {
  return allowedRoles.includes(userRole);
}

export function hasOrgRole(
  userRole: OrgRole | null | undefined,
  allowedRoles: readonly OrgRole[],
) {
  return Boolean(userRole && allowedRoles.includes(userRole));
}

export function tenantPathRequiresActiveLease(pathname: string) {
  return (
    pathname.startsWith("/dashboard/tenant") &&
    !TENANT_HISTORY_ONLY_PATHS.has(pathname)
  );
}
