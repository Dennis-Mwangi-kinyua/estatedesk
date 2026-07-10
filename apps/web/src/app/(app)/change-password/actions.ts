"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";
import {
  parsePlatformModeCookie,
  PLATFORM_MODE_COOKIE_NAME,
} from "@/app/(app)/platform/_lib/nav";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

export type ChangePasswordState = {
  error: string | null;
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
          passwordHash: true,
          platformRole: true,
          mustChangePassword: true,
        },
      }),
    { label: "change-password-find-user" },
  );

  if (!user) {
    return { error: "User account not found." };
  }

  if (user.mustChangePassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: "Fill in all password fields." };
    }

    if (newPassword.length < 8) {
      return { error: "New password must be at least 8 characters." };
    }

    if (newPassword !== confirmPassword) {
      return { error: "New passwords do not match." };
    }

    if (newPassword === currentPassword) {
      return { error: "Choose a different password from the temporary one." };
    }
  }

  const currentMatches = user.mustChangePassword
    ? await bcrypt.compare(currentPassword, user.passwordHash)
    : true;

  if (!currentMatches) {
    return { error: "Temporary password is incorrect." };
  }

  const passwordHash = user.mustChangePassword
    ? await bcrypt.hash(newPassword, 12)
    : user.passwordHash;

  const acceptedAt = new Date();
  const updatedUser = await retryTransientDatabaseOperation(
    () =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          mustChangePassword: false,
          passwordChangedAt: acceptedAt,
          termsAcceptedAt: acceptedAt,
          termsAcceptedVersion: TERMS_VERSION,
        },
        select: {
          mustChangePassword: true,
          termsAcceptedAt: true,
        },
      }),
    { label: "change-password-update-user" },
  );

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
    preferredPlatformMode,
  });

  revalidatePath("/", "layout");
  revalidatePath("/change-password");
  revalidatePath(destination);

  redirect(destination);
}
