import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auditSensitivePageView } from "@/lib/audit/sensitive-pages";
import { isSecurityGatePathname } from "@/lib/auth/security-gate";
import { requireAuthenticated } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { privatePageMetadata } from "@/lib/seo";
import { isDevDebugLoggingEnabled } from "@/lib/dev/background-refresh";

import { SensitiveDataWatermark } from "@/components/security/sensitive-data-watermark";
import { AppActionFeedback } from "@/components/shared/app-action-feedback";
import { DestructiveActionGuard } from "@/components/shared/destructive-action-guard";

export const metadata = privatePageMetadata;

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuthenticated();
  const headerStore = await headers();
  const rawPath = headerStore.get("x-estatedesk-pathname") ?? "";
  const pathname = rawPath.replace(/\/+$/, "");

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
      // eslint-disable-next-line no-console
      console.log("[debug] AppLayout redirecting to /change-password from", rawPath);
    }

    redirect("/change-password");
  }

  let orgLabel: string | null = null;

  if (session.activeOrgId) {
    const organization = await prisma.organization.findUnique({
      where: { id: session.activeOrgId },
      select: { name: true },
    });
    orgLabel = organization?.name ?? null;
  } else if (
    session.platformRole === "PLATFORM_ADMIN" ||
    session.platformRole === "SUPER_ADMIN"
  ) {
    orgLabel = "Platform";
  }

  if (pathname) {
    await auditSensitivePageView(session, pathname);
  }

  return (
    <div className="app-mobile-canvas app-sensitive-surface ed-mobile-surface relative min-h-dvh w-full min-w-0 overflow-x-hidden">
      <SensitiveDataWatermark orgLabel={orgLabel} />
      {children}
      {isSecurityGateRoute ? null : <AppActionFeedback />}
      {isSecurityGateRoute ? null : <DestructiveActionGuard />}
    </div>
  );
}
