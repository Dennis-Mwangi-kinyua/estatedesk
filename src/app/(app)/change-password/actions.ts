"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";

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

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      passwordHash: true,
      platformRole: true,
      mustChangePassword: true,
    },
  });

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

  await prisma.$executeRaw(
    Prisma.sql`
      update "User"
      set
        "passwordHash" = ${passwordHash},
        "mustChangePassword" = false,
        "passwordChangedAt" = now(),
        "termsAcceptedAt" = now(),
        "termsAcceptedVersion" = ${TERMS_VERSION},
        "updatedAt" = now()
      where "id" = ${user.id}
    `,
  );

  const destination = getRedirectAfterLogin({
    platformRole: session.platformRole,
    activeOrgRole: session.activeOrgRole,
    activeOrgId: session.activeOrgId,
    hasTenantProfile: session.activeOrgRole === "TENANT",
  });

  redirect(destination);
}
