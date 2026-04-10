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
    console.time("loginAction-total");

    console.time("login-find-user");
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        platformRole: true,
        status: true,
        passwordHash: true,
        deletedAt: true,
      },
    });
    console.timeEnd("login-find-user");

    if (!user || user.deletedAt) {
      console.timeEnd("loginAction-total");
      return {
        success: false,
        error: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    if (user.status !== "ACTIVE") {
      console.timeEnd("loginAction-total");
      return {
        success: false,
        error:
          "Your account is not active. Contact support or your administrator.",
      };
    }

    if (!user.passwordHash || typeof user.passwordHash !== "string") {
      console.timeEnd("loginAction-total");
      return {
        success: false,
        error: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    console.time("login-bcrypt-compare");
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    console.timeEnd("login-bcrypt-compare");

    if (!passwordMatches) {
      console.timeEnd("loginAction-total");
      return {
        success: false,
        error: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    console.time("login-load-membership");
    const primaryMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
      },
      select: {
        orgId: true,
        role: true,
        scopeType: true,
        scopeId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.timeEnd("login-load-membership");

    let tenant: { id: string } | null = null;

    if (!primaryMembership) {
      console.time("login-load-tenant");
      tenant = await prisma.tenant.findFirst({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      });
      console.timeEnd("login-load-tenant");
    }

    if (!primaryMembership && !tenant) {
      console.timeEnd("loginAction-total");
      return {
        success: false,
        error: "No active organization or tenant account is linked to this user.",
      };
    }

    console.time("login-set-session");
    await setUserSession({
      userId: user.id,
      email: user.email ?? email,
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
    console.timeEnd("login-set-session");

    void prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((error) => {
        console.error("lastLoginAt update failed:", error);
      });

    console.time("login-get-destination");
    const destination = getRedirectAfterLogin({
      platformRole: user.platformRole,
      activeOrgRole: primaryMembership?.role ?? null,
      activeOrgId: primaryMembership?.orgId ?? null,
      hasTenantProfile: Boolean(tenant),
    });
    console.timeEnd("login-get-destination");

    console.timeEnd("loginAction-total");
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