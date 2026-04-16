"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/notifications/email";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function forgotPasswordAction(formData: FormData) {
  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    redirect("/forgot-password?status=invalid_email");
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      email: true,
    },
  });

  if (user?.email) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({
      where: {
        email,
        usedAt: null,
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: email,
      resetUrl,
    });
  }

  redirect("/forgot-password?status=sent");
}