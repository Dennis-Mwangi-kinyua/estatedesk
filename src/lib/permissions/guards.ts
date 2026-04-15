import "server-only";

import { redirect } from "next/navigation";
import {
  requireUserSession,
  type AppSession,
  type OrgRole,
  type PlatformRole,
} from "@/lib/auth/session";

type GuardOptions = {
  redirectTo?: string;
};

function deny(redirectTo = "/login"): never {
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
    deny(options?.redirectTo ?? "/dashboard");
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
    deny(options?.redirectTo ?? "/dashboard");
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
  return requireOrgRole(["TENANT"], options);
}