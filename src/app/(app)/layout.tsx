import { ReactNode } from "react";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createRedirectMarkerCookieValue,
  getEphemeralCookieOptions,
  getRedirectMarkerCookieName,
  hasValidRedirectMarkerCookie,
} from "@/lib/auth/cookies";
import { requireAuthenticated } from "@/lib/permissions/guards";
import { privatePageMetadata } from "@/lib/seo";

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

  const shouldForceChange =
    !pathname.startsWith("/change-password") &&
    (session.mustChangePassword || session.requiresTermsAcceptance) &&
    !isPlatformAdmin;

  if (shouldForceChange) {
    // Prevent rapid redirect loops by using a short-lived cookie marker.
    const cookieStore = await cookies();
    const marker = cookieStore.get(getRedirectMarkerCookieName());

    if (hasValidRedirectMarkerCookie(marker?.value)) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(
          "[debug] skipping /change-password redirect because marker cookie is present",
        );
      }
    } else {
      // set a 5 second marker to avoid redirect storms
      cookieStore.set(
        getRedirectMarkerCookieName(),
        createRedirectMarkerCookieValue(),
        getEphemeralCookieOptions(5),
      );

      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[debug] AppLayout redirecting to /change-password from", rawPath, session);
      }

      redirect("/change-password");
    }
  }

  return (
    <div className="app-mobile-canvas min-h-screen">
      {children}
      {pathname === "/change-password" ? null : <AppActionFeedback />}
      <DestructiveActionGuard />
    </div>
  );
}
