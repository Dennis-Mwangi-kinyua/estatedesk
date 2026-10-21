import type { Metadata } from "next";
import { getOrganizationSummary } from "@/lib/organizations/summary";
import { WorkspaceAccessProvider } from "@/components/navigation/workspace-link";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { WorkspaceThemeScope } from "@/components/shared/workspace-theme-scope";
import { ProfilePictureProvider } from "@/components/uploads/profile-picture-context";
import "./workspace.css";
import "./workspace-controls.css";
import { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auditSensitivePageView } from "@/lib/audit/sensitive-pages";
import { isSecurityGatePathname } from "@/lib/auth/security-gate";
import { requireAuthenticated } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { privatePageMetadata } from "@/lib/seo";
import { isDevDebugLoggingEnabled } from "@/lib/dev/background-refresh";

import { PwaAppBadgeSync } from "@/components/pwa/pwa-app-badge-sync";
import { SensitiveDataWatermark } from "@/components/security/sensitive-data-watermark";
import { AppActionFeedback } from "@/components/shared/app-action-feedback";
import { DestructiveActionGuard } from "@/components/shared/destructive-action-guard";
import { tenantCanAccessWorkspacePath } from "@/lib/permissions/access";

export const metadata: Metadata = privatePageMetadata;

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuthenticated();
  const headerStore = await headers();
  const rawPath = headerStore.get("x-estatedesk-pathname") ?? "";
  const pathname = rawPath.replace(/\/+$/, "");

  if (pathname && session.activeOrgRole === "TENANT" && !tenantCanAccessWorkspacePath(pathname)) {
    redirect("/dashboard/tenant");
  }

  if (pathname && (pathname.startsWith("/platform") || pathname.startsWith("/dashboard/")) && !canAccessWorkspacePath(session, pathname)) {
    notFound();
  }

  // Only force password change / terms acceptance for non-platform users.
  const isPlatformAdmin =
    session.platformRole === "PLATFORM_ADMIN" || session.platformRole === "SUPER_ADMIN";

  const isSecurityGateRoute = isSecurityGatePathname(pathname);

  const shouldForceChange =
    Boolean(pathname) &&
    !isSecurityGateRoute &&
    (session.mustChangePassword || session.requiresTermsAcceptance) &&
    !isPlatformAdmin;

  if (shouldForceChange) {
    if (isDevDebugLoggingEnabled()) {
      console.log("[debug] AppLayout redirecting to /change-password from", rawPath);
    }

    redirect("/change-password");
  }

  const orgLabelFallback = !session.activeOrgId && (
    session.platformRole === "PLATFORM_ADMIN" ||
    session.platformRole === "SUPER_ADMIN"
  ) ? "Platform" : null;

  // These independent lookups used to run one after another on every page
  // navigation. Run them together so shell latency follows the slowest query.
  const [organization, user] = await Promise.all([
    session.activeOrgId
      ? getOrganizationSummary(session.activeOrgId).catch((error) => {
          if (isDevDebugLoggingEnabled()) {
            console.warn("[AppLayout] organization lookup failed", error);
          }
          return null;
        })
      : Promise.resolve(null),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { profileImageUrl: true },
    }),
    pathname
      ? auditSensitivePageView(session, pathname).catch((error) => {
          // Audit is best-effort — never block authenticated pages on logging failures.
          if (isDevDebugLoggingEnabled()) {
            console.warn("[AppLayout] auditSensitivePageView failed", error);
          }
        })
      : Promise.resolve(),
  ]);
  const orgLabel = organization?.name ?? orgLabelFallback;
  return (
    <WorkspaceAccessProvider access={{ orgRolePolicy: session.orgRolePolicy, grantedPermissions: session.grantedPermissions, platformRole: session.platformRole, activeOrgRole: session.activeOrgRole, activeOrgId: session.activeOrgId, membershipScope: session.membershipScope }}>
    <ProfilePictureProvider url={user?.profileImageUrl ?? null}>
    <div className="estate-workspace app-mobile-canvas app-sensitive-surface ed-mobile-surface relative min-h-dvh w-full min-w-0 overflow-x-hidden">
      <WorkspaceThemeScope />
      <SensitiveDataWatermark orgLabel={orgLabel} timestamp={new Date().toISOString()} />
      {children}
      {isSecurityGateRoute ? null : <PwaAppBadgeSync />}
      {isSecurityGateRoute ? null : <AppActionFeedback />}
      {isSecurityGateRoute ? null : <DestructiveActionGuard />}
    </div>
    </ProfilePictureProvider>
    </WorkspaceAccessProvider>
  );
}
