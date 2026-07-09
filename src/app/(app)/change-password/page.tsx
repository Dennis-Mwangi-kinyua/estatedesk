import { redirect } from "next/navigation";
import { SecurityGateShell } from "@/components/auth/security-gate-shell";
import { requireUserSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";
import {
  parsePlatformModeCookie,
  PLATFORM_MODE_COOKIE_NAME,
} from "@/app/(app)/platform/_lib/nav";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const session = await requireUserSession();

  if (!session.mustChangePassword && !session.requiresTermsAcceptance) {
    const cookieStore = await cookies();
    const preferredPlatformMode = parsePlatformModeCookie(
      cookieStore.get(PLATFORM_MODE_COOKIE_NAME)?.value,
    );
    redirect(
      getRedirectAfterLogin({
        platformRole: session.platformRole,
        activeOrgRole: session.activeOrgRole,
        activeOrgId: session.activeOrgId,
        hasTenantProfile: session.activeOrgRole === "TENANT",
        preferredPlatformMode,
      }),
    );
  }

  return (
    <SecurityGateShell
      title="Change your password"
      description={
        session.mustChangePassword
          ? "This is your first sign-in with a temporary password. Create your own password and accept the terms before continuing to EstateDesk."
          : "Accept the EstateDesk terms of use before continuing to the system."
      }
    >
      <ChangePasswordForm requirePasswordChange={session.mustChangePassword} />
    </SecurityGateShell>
  );
}