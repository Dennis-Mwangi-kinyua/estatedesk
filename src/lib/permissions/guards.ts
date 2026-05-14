import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  requireUserSession,
  type AppSession,
  type OrgRole,
  type PlatformRole,
} from "@/lib/auth/session";
import { auditDeniedAccess } from "@/lib/audit/security";
import { prisma } from "@/lib/prisma";

type GuardOptions = {
  redirectTo?: string;
};

const TENANT_HISTORY_ONLY_PATHS = new Set([
  "/dashboard/tenant",
  "/dashboard/tenant/profile",
]);

function deny(redirectTo = "/access-denied"): never {
  redirect(redirectTo);
}

export async function requireAuthenticated(): Promise<AppSession> {
  return requireUserSession();
}

export async function requirePlatformRole(
  allowedRoles: PlatformRole[],
  options?: GuardOptions,
): Promise<AppSession> {
  const session = await requireAuthenticated();

  if (!allowedRoles.includes(session.platformRole)) {
    await auditDeniedAccess({
      session,
      reason: "Missing platform role",
      required: allowedRoles,
      entityType: "Platform",
      entityId: "platform",
    });
    deny(options?.redirectTo ?? "/access-denied");
  }

  return session;
}

export async function requireOrgMembership(
  options?: GuardOptions,
): Promise<AppSession> {
  const session = await requireAuthenticated();

  if (!session.activeOrgId || !session.activeOrgRole) {
    deny(options?.redirectTo ?? "/login");
  }

  return session;
}

export async function requireOrgRole(
  allowedRoles: OrgRole[],
  options?: GuardOptions,
): Promise<AppSession> {
  const session = await requireOrgMembership(options);

  if (!session.activeOrgRole || !allowedRoles.includes(session.activeOrgRole)) {
    await auditDeniedAccess({
      session,
      reason: "Missing organization role",
      required: allowedRoles,
      entityType: "Organization",
      entityId: session.activeOrgId ?? "unknown",
    });
    deny(options?.redirectTo ?? "/access-denied");
  }

  return session;
}

export async function requireAnyRoleAccess(options?: GuardOptions) {
  const session = await requireOrgMembership(options);

  return {
    session,
    role: session.activeOrgRole,
  };
}

export async function requireManagementAccess(options?: GuardOptions) {
  return requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"], options);
}

export async function requireCaretakerAccess(options?: GuardOptions) {
  return requireOrgRole(["CARETAKER"], options);
}

export async function requireTenantAccess(options?: GuardOptions) {
  const session = await requireOrgRole(["TENANT"], options);
  const headerStore = await headers();
  const pathname = headerStore.get("x-estatedesk-pathname") ?? "";

  if (
    pathname.startsWith("/dashboard/tenant") &&
    !TENANT_HISTORY_ONLY_PATHS.has(pathname)
  ) {
    const activeLease = await prisma.lease.findFirst({
      where: {
        orgId: session.activeOrgId!,
        tenant: {
          userId: session.userId,
          deletedAt: null,
        },
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!activeLease) {
      redirect("/dashboard/tenant");
    }
  }

  return session;
}
