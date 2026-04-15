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

function makeLabel(prefix: string, requestId: string) {
  return `${prefix}-${requestId}`;
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  console.time(label);
  try {
    return await fn();
  } finally {
    console.timeEnd(label);
  }
}

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
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const totalLabel = makeLabel("loginAction-total", requestId);
  console.time(totalLabel);

  try {
    const user = await timed(
      makeLabel("login-find-user", requestId),
      async () => {
        return prisma.user.findUnique({
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
      },
    );

    if (!user || user.deletedAt) {
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

    const passwordMatches = await timed(
      makeLabel("login-bcrypt-compare", requestId),
      async () => bcrypt.compare(password, user.passwordHash),
    );

    if (!passwordMatches) {
      return {
        success: false,
        error: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    const primaryMembership = await timed(
      makeLabel("login-load-membership", requestId),
      async () => {
        return prisma.membership.findFirst({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            orgId: true,
            role: true,
            scopeType: true,
            scopeId: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      },
    );

    let tenant: { id: string } | null = null;

    if (!primaryMembership) {
      tenant = await timed(
        makeLabel("login-load-tenant", requestId),
        async () => {
          return prisma.tenant.findFirst({
            where: {
              userId: user.id,
            },
            select: {
              id: true,
            },
          });
        },
      );
    }

    if (!primaryMembership && !tenant) {
      return {
        success: false,
        error: "No active organization or tenant account is linked to this user.",
      };
    }

    await timed(makeLabel("login-set-session", requestId), async () => {
      await setUserSession({
        userId: user.id,
        activeMembershipId: primaryMembership?.id ?? null,
      });
    });

    void prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((error) => {
        console.error("lastLoginAt update failed:", error);
      });

    const destination = await timed(
      makeLabel("login-get-destination", requestId),
      async () =>
        getRedirectAfterLogin({
          platformRole: user.platformRole,
          activeOrgRole: primaryMembership?.role ?? null,
          activeOrgId: primaryMembership?.orgId ?? null,
          hasTenantProfile: Boolean(tenant),
        }),
    );

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
  } finally {
    console.timeEnd(totalLabel);
  }
}