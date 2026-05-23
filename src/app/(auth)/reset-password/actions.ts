"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function isStrongEnough(password: string) {
  return password.length >= 8;
}

export async function resetPasswordAction(formData: FormData) {
  const tokenValue = formData.get("token");
  const passwordValue = formData.get("password");
  const confirmPasswordValue = formData.get("confirmPassword");

  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";
  const password =
    typeof passwordValue === "string" ? passwordValue.trim() : "";
  const confirmPassword =
    typeof confirmPasswordValue === "string"
      ? confirmPasswordValue.trim()
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

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
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
      email: resetToken.email,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    redirect("/reset-password?status=invalid");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
      },
    }),
    prisma.passwordResetToken.update({
      where: { token: resetToken.token },
      data: {
        usedAt: new Date(),
      },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        email: resetToken.email,
        usedAt: null,
        token: {
          not: resetToken.token,
        },
      },
    }),
  ]);

  redirect("/reset-password?status=success");
}