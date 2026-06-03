import { redirect } from "next/navigation";
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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] p-4">
      <section className="ios-panel w-full max-w-lg rounded-[30px] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Account security
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
            Change your password
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {session.mustChangePassword
              ? "This is your first sign-in with a temporary password. Create your own password and accept the terms before continuing to EstateDesk."
              : "Accept the EstateDesk terms of use before continuing to the system."}
          </p>
        </div>

        <ChangePasswordForm requirePasswordChange={session.mustChangePassword} />
      </section>
    </div>
  );
}
