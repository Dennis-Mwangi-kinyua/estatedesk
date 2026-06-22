"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/notifications/email";
import { hashOpaqueToken } from "@/lib/crypto/tokens";
import { checkRateLimit } from "@/lib/rate-limit";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headerStore.get("x-real-ip") ?? "unknown";
}

export async function forgotPasswordAction(formData: FormData) {
  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const ipLimiter = await checkRateLimit({
    key: `forgot-password:ip:${ipAddress}`,
    limit: 12,
    windowMs: 15 * 60 * 1000,
  });

  if (!ipLimiter.allowed) {
    redirect("/forgot-password?status=limited");
  }

  const emailValue = formData.get("email");
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    redirect("/forgot-password?status=invalid_email");
  }

  const emailLimiter = await checkRateLimit({
    key: `forgot-password:email:${ipAddress}:${email}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!emailLimiter.allowed) {
    redirect("/forgot-password?status=limited");
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
    const tokenHash = hashOpaqueToken(token, "password-reset");
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
        token: tokenHash,
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
