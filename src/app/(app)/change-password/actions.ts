"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";

export type ChangePasswordState = {
  error: string | null;
};

export async function changeInitialPasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await requireUserSession();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

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

  const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!currentMatches) {
    return { error: "Temporary password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  });

  const destination = getRedirectAfterLogin({
    platformRole: session.platformRole,
    activeOrgRole: session.activeOrgRole,
    activeOrgId: session.activeOrgId,
    hasTenantProfile: session.activeOrgRole === "TENANT",
  });

  redirect(destination);
}
