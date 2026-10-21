"use server";

import { redeemPasswordLink } from "@/lib/auth/redeem-password-link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashOpaqueToken, legacyHashOpaqueToken } from "@/lib/crypto/tokens";
import { sendSecurityAlert } from "@/lib/security/alerts";

function isStrongEnough(password: string) {
  return password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72;
}

export async function resetPasswordAction(formData: FormData) {
  const tokenValue = formData.get("token");
  const passwordValue = formData.get("password");
  const confirmPasswordValue = formData.get("confirmPassword");

  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";
  const password =
    typeof passwordValue === "string" ? passwordValue : "";
  const confirmPassword =
    typeof confirmPasswordValue === "string"
      ? confirmPasswordValue
      : "";

  if (!token) {
    redirect("/reset-password?status=missing_token");
  }

  if (!isStrongEnough(password)) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&status=weak_password`);
  }

  if (password !== confirmPassword) {
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&status=password_mismatch`
    );
  }

  const tokenHash = hashOpaqueToken(token, "password-reset");
  const legacyTokenHash = legacyHashOpaqueToken(token);

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      OR: [
        { token: tokenHash },
        { token: legacyTokenHash },
      ],
    },
  });

  if (!resetToken) {
    redirect("/reset-password?status=invalid");
  }

  if (resetToken.usedAt) {
    redirect("/reset-password?status=invalid");
  }

  if (resetToken.expiresAt < new Date()) {
    redirect("/reset-password?status=expired");
  }

  const user = await prisma.user.findFirst({
    where: {
      ...(resetToken.userId ? { id: resetToken.userId } : { email: resetToken.email }),
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    redirect("/reset-password?status=invalid");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const redeemed = await prisma.$transaction(tx => redeemPasswordLink(tx, {
    tokenId: resetToken.id, userId: user.id, email: resetToken.email, passwordHash,
  }));
  if (!redeemed) redirect("/reset-password?status=invalid");

  await sendSecurityAlert({
    event: "PASSWORD_RESET_COMPLETED",
    severity: "warning",
    actorUserId: user.id,
    entityType: "User",
    entityId: user.id,
    summary: "A user completed password reset with a reset token.",
    metadata: {
      email: resetToken.email,
    },
  });

  redirect("/reset-password?status=success");
}
