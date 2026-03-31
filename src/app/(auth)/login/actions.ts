"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";
import { setUserSession } from "@/lib/auth/session";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export type LoginActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const GENERIC_LOGIN_ERROR_MESSAGE =
  "Unable to sign in right now. Please try again.";

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        deletedAt: null,
      },
      include: {
        memberships: {
          include: { org: true },
          orderBy: { createdAt: "asc" },
        },
        tenant: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    if (user.status !== "ACTIVE") {
      return {
        success: false,
        error:
          "Your account is not active. Contact support or your administrator.",
      };
    }

    if (!user.passwordHash || typeof user.passwordHash !== "string") {
      return {
        success: false,
        error: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return {
        success: false,
        error: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    const activeMemberships = user.memberships.filter(
      (membership) =>
        membership.org.deletedAt === null && membership.org.status === "ACTIVE",
    );

    const primaryMembership = activeMemberships[0] ?? null;

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await setUserSession({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      platformRole: user.platformRole,
      activeOrgId: primaryMembership?.orgId ?? null,
      activeOrgRole: primaryMembership?.role ?? null,
      membershipScope: primaryMembership
        ? {
            scopeType: primaryMembership.scopeType,
            scopeId: primaryMembership.scopeId,
          }
        : null,
    });

    const destination = getRedirectAfterLogin({
      platformRole: user.platformRole,
      memberships: activeMemberships.map((membership) => ({
        orgId: membership.orgId,
        orgSlug: membership.org.slug,
        orgStatus: membership.org.status,
        role: membership.role,
        scopeType: membership.scopeType,
        scopeId: membership.scopeId,
      })),
      hasTenantProfile: Boolean(user.tenant),
    });

    redirect(destination);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("loginAction error:", error);

    return {
      success: false,
      error: GENERIC_LOGIN_ERROR_MESSAGE,
    };
  }
}