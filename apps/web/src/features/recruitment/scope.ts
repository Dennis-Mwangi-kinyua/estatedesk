import type { AppSession } from "@/lib/auth/session";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { check } from "./policy";
export type HiringScope = "platform" | "organization";
export function hiringOrgId(session: AppSession, scope: HiringScope): string | null {
  check(!session.mustChangePassword && !session.requiresTermsAcceptance, "Complete account setup before managing recruitment.");
  if (scope === "platform") { check(["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole), "Platform recruitment access is required."); return null; }
  check(session.activeOrgId && session.membershipScope?.scopeType === "ORG" && ["ADMIN", "MANAGER"].includes(session.activeOrgRole ?? "") && canAccessWorkspacePath(session, "/dashboard/org/recruitment") && session.orgRolePolicy?.permissions["org.users.manage"] !== "deny", "Organization-wide recruitment access is required.");
  return session.activeOrgId;
}
export const hiringBase = (scope: HiringScope) => scope === "platform" ? "/platform/recruitment" : "/dashboard/org/recruitment";
