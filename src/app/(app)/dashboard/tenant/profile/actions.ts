"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";

export type VerifyTenantPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyTenantPassword(
  password: string
): Promise<VerifyTenantPasswordResult> {
  try {
    const session = await requireTenantAccess();

    if (!session.userId) {
      return { ok: false, error: "Unauthorized." };
    }

    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      return { ok: false, error: "Password is required." };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        passwordHash: true,
        deletedAt: true,
        status: true,
      },
    });

    if (!user || user.deletedAt) {
      return { ok: false, error: "User account not found." };
    }

    if (user.status !== "ACTIVE") {
      return { ok: false, error: "Your account is not active." };
    }

    const isValid = await bcrypt.compare(trimmedPassword, user.passwordHash);

    if (!isValid) {
      return { ok: false, error: "Incorrect password." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to verify password right now." };
  }
}