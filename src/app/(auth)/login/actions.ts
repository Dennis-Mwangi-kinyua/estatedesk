"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";
import { setUserSession } from "@/lib/auth/session";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email or username is required")
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

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headerStore.get("x-real-ip") ?? "unknown";
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    return fn();
  }

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

  const { email: identifier, password } = parsed.data;
  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const limiter = await checkRateLimit({
    key: `login:${ipAddress}:${identifier}`,
    limit: 8,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return {
      success: false,
      error: `Too many sign-in attempts. Please wait ${limiter.retryAfterSeconds} seconds and try again.`,
    };
  }

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const totalLabel = makeLabel("loginAction-total", requestId);
  if (process.env.NODE_ENV !== "production") {
    console.time(totalLabel);
  }

  try {
    const user = await timed(
      makeLabel("login-find-user", requestId),
      async () => {
        return prisma.user.findUnique({
          where: identifier.includes("@")
            ? { email: identifier }
            : { username: identifier },
          select: {
            id: true,
            email: true,
            fullName: true,
            platformRole: true,
            status: true,
            passwordHash: true,
            mustChangePassword: true,
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

    // Platform admins do not need org membership or tenant profile
    if (
      user.platformRole === "PLATFORM_ADMIN" ||
      user.platformRole === "SUPER_ADMIN"
    ) {
      await timed(makeLabel("login-set-session", requestId), async () => {
        await setUserSession({
          userId: user.id,
          activeMembershipId: null,
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
          user.mustChangePassword
            ? "/change-password"
            : getRedirectAfterLogin({
                platformRole: user.platformRole,
                activeOrgRole: null,
                activeOrgId: null,
                hasTenantProfile: false,
              }),
      );

      redirect(destination);
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
        user.mustChangePassword
          ? "/change-password"
          : getRedirectAfterLogin({
              platformRole: user.platformRole,
              activeOrgRole: primaryMembership?.role ?? null,
              activeOrgId: primaryMembership?.orgId ?? null,
              hasTenantProfile: Boolean(tenant),
            }),
    );

    return redirect(destination);
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
    if (process.env.NODE_ENV !== "production") {
      console.timeEnd(totalLabel);
    }
  }
}
