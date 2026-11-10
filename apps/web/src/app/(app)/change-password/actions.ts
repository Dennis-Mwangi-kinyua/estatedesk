"use server";

import { AccountPasswordError, changeAccountPassword } from "@/features/security/_lib/change-password";
import { createSessionCookieValue, getSessionCookieName, getSessionCookieOptions } from "@/lib/auth/cookies";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession, getCurrentSessionId } from "@/lib/auth/session";
import { cookies, headers } from "next/headers";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";
import {
  parsePlatformModeCookie,
  PLATFORM_MODE_COOKIE_NAME,
} from "@/app/(app)/platform/_lib/nav";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

export type ChangePasswordState = {
  error: string | null;
  redirectTo?: string;
};

const TERMS_VERSION = "2026-06-02";

export async function changeInitialPasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await requireUserSession();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const acceptedTerms = String(formData.get("acceptedTerms") ?? "") === "on";

  if (!acceptedTerms) {
    return { error: "Accept the terms of use to continue." };
  }

  const user = await retryTransientDatabaseOperation(
    () =>
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          platformRole: true,
          mustChangePassword: true,
        },
      }),
    { label: "change-password-find-user" },
  );

  if (!user) {
    return { error: "User account not found." };
  }

  const acceptedAt = new Date();
  let updatedUser: { mustChangePassword: boolean; termsAcceptedAt: Date | null };
  if (user.mustChangePassword) {
    const sessionId = await getCurrentSessionId();
    if (!sessionId) return { error: "Sign in again before completing account setup." };
    try {
      const renewed = await changeAccountPassword({ userId: user.id, sessionId, values: { currentPassword, newPassword, confirmPassword }, acceptTermsVersion: TERMS_VERSION });
      const maxAge = Math.max(1, Math.floor((renewed.expiresAt.getTime() - Date.now()) / 1000));
      (await cookies()).set(getSessionCookieName(), createSessionCookieValue(renewed.token), getSessionCookieOptions(maxAge));
      updatedUser = { mustChangePassword: false, termsAcceptedAt: acceptedAt };
    } catch (error) {
      return { error: error instanceof AccountPasswordError ? error.message : "Could not complete account setup. Please try again or sign in again." };
    }
  } else {
    // Terms-only acceptance must not overwrite a concurrently changed password
    // or claim that the password changed at the terms acceptance timestamp.
    updatedUser = await retryTransientDatabaseOperation(() => prisma.user.update({
      where: { id: user.id },
      data: { termsAcceptedAt: acceptedAt, termsAcceptedVersion: TERMS_VERSION },
      select: { mustChangePassword: true, termsAcceptedAt: true },
    }), { label: "change-password-accept-terms" });
  }

  if (updatedUser.mustChangePassword || !updatedUser.termsAcceptedAt) {
    return {
      error:
        "Your account was not fully updated. Please try again, or contact an administrator.",
    };
  }

  const cookieStore = await cookies();
  const preferredPlatformMode = parsePlatformModeCookie(
    cookieStore.get(PLATFORM_MODE_COOKIE_NAME)?.value,
  );

  const destination = getRedirectAfterLogin({
    platformRole: session.platformRole,
    activeOrgRole: session.activeOrgRole,
    activeOrgId: session.activeOrgId,
    hasTenantProfile: session.activeOrgRole === "TENANT",
    hasServiceProvider: !session.activeOrgRole && session.platformRole === "USER" && Boolean(await prisma.serviceProvider.findUnique({ where: { userId: session.userId }, select: { id: true } })),
    preferredPlatformMode,
  });

  revalidatePath("/", "layout");
  revalidatePath("/change-password");
  revalidatePath(destination);

  if ((await headers()).has("next-action")) return { error: null, redirectTo: destination };
  redirect(destination);
}
