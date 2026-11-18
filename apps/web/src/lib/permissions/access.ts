import type { OrgRole, PlatformRole } from "@/lib/auth/session";

const TENANT_PATHS_WITHOUT_ACTIVE_LEASE = new Set([
  "/dashboard/tenant/history",
  "/dashboard/tenant",
  "/dashboard/tenant/profile",
  "/dashboard/tenant/invoice/archive",
  "/dashboard/tenant/payments/status",
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
    !TENANT_PATHS_WITHOUT_ACTIVE_LEASE.has(pathname) &&
    !/^\/dashboard\/tenant\/invoice\/\d{4}-\d{2}\/(?:view|download)$/.test(pathname) &&
    !/^\/dashboard\/tenant\/move-out\/[^/]+$/.test(pathname)
  );
}

export function tenantCanAccessWorkspacePath(pathname: string) {
  const path = new URL(pathname || "/dashboard", "https://estatedesk.invalid").pathname.replace(/\/+$/, "");
  return path === "/dashboard/tenant" || path.startsWith("/dashboard/tenant/") ||
    ["/account-deletion", "/dashboard/security", "/dashboard/today", "/dashboard", "/profile", "/change-password", "/access-denied", "/tenants/notifications", "/tenants/documents", "/tenants/bills", "/tenants/leases", "/tenants/payments"].includes(path);
}

/** Developer mode uses the existing platform operator roles; organization roles never grant audit access. */
export function canViewAuditLogs(platformRole: string | null | undefined) {
  return platformRole === "SUPER_ADMIN" || platformRole === "PLATFORM_ADMIN";
}
