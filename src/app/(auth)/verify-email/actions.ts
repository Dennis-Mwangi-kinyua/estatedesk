"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/notifications/email";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function verifyEmailAction(formData: FormData) {
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";

  if (!token) {
    redirect("/verify-email?status=invalid");
  }

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    redirect("/verify-email?status=invalid");
  }

  if (verificationToken.usedAt) {
    redirect("/verify-email?status=invalid");
  }

  if (verificationToken.expiresAt < new Date()) {
    redirect("/verify-email?status=expired");
  }

  const user = await prisma.user.findFirst({
    where: {
      email: verificationToken.email,
      deletedAt: null,
    },
    select: {
      id: true,
      emailVerified: true,
    },
  });

  if (!user) {
    redirect("/verify-email?status=invalid");
  }

  if (user.emailVerified) {
    await prisma.emailVerificationToken.update({
      where: { token: verificationToken.token },
      data: { usedAt: new Date() },
    });

    redirect("/verify-email?status=already_verified");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    }),
    prisma.emailVerificationToken.update({
      where: { token: verificationToken.token },
      data: {
        usedAt: new Date(),
      },
    }),
  ]);

  redirect("/verify-email?status=verified");
}

export async function resendVerificationEmailAction(formData: FormData) {
  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

  if (!email) {
    redirect("/verify-email?status=missing_email");
  }

  if (!isValidEmail(email)) {
    redirect(
      `/verify-email?status=invalid_email&email=${encodeURIComponent(email)}`
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  if (!user?.email) {
    redirect("/verify-email?status=sent");
  }

  if (user.emailVerified) {
    redirect("/verify-email?status=already_verified");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.deleteMany({
    where: {
      email,
      usedAt: null,
    },
  });

  await prisma.emailVerificationToken.create({
    data: {
      email,
      token,
      expiresAt,
    },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  await sendVerificationEmail({
    to: email,
    verifyUrl,
  });

  redirect(`/verify-email?status=sent&email=${encodeURIComponent(email)}`);
}