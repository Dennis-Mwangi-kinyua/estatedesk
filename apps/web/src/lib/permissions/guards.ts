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
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import {
  hasOrgRole,
  hasPlatformRole,
  tenantPathRequiresActiveLease,
} from "@/lib/permissions/access";
import {
  roleHasOrgPermission,
  type OrgPermission,
} from "@/lib/permissions/role-matrix";

type GuardOptions = {
  redirectTo?: string;
};

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

  if (!hasPlatformRole(session.platformRole, allowedRoles)) {
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

  // Platform operators retain access during website maintenance / surface kills.
  const isPlatformOperator =
    session.platformRole === "SUPER_ADMIN" ||
    session.platformRole === "PLATFORM_ADMIN";

  if (!isPlatformOperator) {
    const { getPlatformControl, defaultMaintenanceMessage } = await import(
      "@/lib/platform/control"
    );
    const control = await getPlatformControl();
    const role = session.activeOrgRole;
    const isFieldPortal =
      role === "TENANT" || role === "CARETAKER" || role === "LANDLORD";
    const isOrgWorkspace =
      role === "ADMIN" ||
      role === "MANAGER" ||
      role === "OFFICE" ||
      role === "ACCOUNTANT";

    if (control.maintenanceMode) {
      redirect(
        `/maintenance?message=${encodeURIComponent(defaultMaintenanceMessage(control))}`,
      );
    }

    if (control.orgDashboardsDisabled && isOrgWorkspace) {
      redirect(
        `/maintenance?message=${encodeURIComponent(
          control.maintenanceMessage?.trim() ||
            "Organization workspaces are temporarily disabled by platform control.",
        )}`,
      );
    }

    if (control.tenantPortalsDisabled && isFieldPortal) {
      redirect(
        `/maintenance?message=${encodeURIComponent(
          control.maintenanceMessage?.trim() ||
            "Tenant and field portals are temporarily disabled by platform control.",
        )}`,
      );
    }
  }

  const org = await retryTransientDatabaseOperation(
    () =>
      prisma.organization.findUnique({
        where: { id: session.activeOrgId! },
        select: { name: true, status: true, deletedAt: true },
      }),
    { label: "requireOrgMembership-find-org" },
  );

  if (!org || org.deletedAt || org.status !== "ACTIVE") {
    redirect(
      `/service-terminated${org?.name ? `?organization=${encodeURIComponent(org.name)}` : ""}`,
    );
  }

  return session;
}

export async function requireOrgRole(
  allowedRoles: OrgRole[],
  options?: GuardOptions,
): Promise<AppSession> {
  const session = await requireOrgMembership(options);

  if (!hasOrgRole(session.activeOrgRole, allowedRoles)) {
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

export async function requireOrgPermission(
  permission: OrgPermission,
  options?: GuardOptions,
): Promise<AppSession> {
  const session = await requireOrgMembership(options);

  if (!roleHasOrgPermission(session.activeOrgRole, permission)) {
    await auditDeniedAccess({
      session,
      reason: "Missing organization permission",
      required: [permission],
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

  if (tenantPathRequiresActiveLease(pathname)) {
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
