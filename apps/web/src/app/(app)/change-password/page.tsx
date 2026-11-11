import { redirect } from "next/navigation";
import { SecurityGateShell } from "@/components/auth/security-gate-shell";
import { requireUserSession } from "@/lib/auth/session";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const session = await requireUserSession();

  if (!session.mustChangePassword && !session.requiresTermsAcceptance) {
    redirect(
      getRedirectAfterLogin({
        platformRole: session.platformRole,
        activeOrgRole: session.activeOrgRole,
        activeOrgId: session.activeOrgId,
        hasTenantProfile: session.activeOrgRole === "TENANT",
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