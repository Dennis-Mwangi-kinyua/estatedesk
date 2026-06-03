"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";
import { ActiveSessionLimitError, setUserSession } from "@/lib/auth/session";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";
import {
  isTransientDatabaseError,
  retryTransientDatabaseOperation,
} from "@/lib/db/retry";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email or username is required")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
  returnTo: z.preprocess(
    (value) => (typeof value === "string" && value ? value : undefined),
    z.string().optional(),
  ),
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
const DATABASE_UNAVAILABLE_MESSAGE =
  "The database is taking too long to respond. Please try again in a moment.";
const LOGIN_RATE_LIMIT_TIMEOUT_MS = 2_500;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function retryTransientLoginDbOperation<T>(
  label: string,
  operation: () => Promise<T>,
): Promise<T> {
  return retryTransientDatabaseOperation(operation, {
    attempts: 2,
    delayMs: 350,
    label,
  });
}

async function getLoginRateLimitError({
  identifier,
  ipAddress,
}: {
  identifier: string;
  ipAddress: string;
}): Promise<LoginActionState | null> {
  try {
    const limiter = await withTimeout(
      checkRateLimit({
        key: `login:${ipAddress}:${identifier}`,
        limit: 8,
        windowMs: 60_000,
      }),
      LOGIN_RATE_LIMIT_TIMEOUT_MS,
      "login rate limit check",
    );

    if (!limiter.allowed) {
      return {
        success: false,
        error: `Too many sign-in attempts. Please wait ${limiter.retryAfterSeconds} seconds and try again.`,
      };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "login rate limit check failed";
    console.warn("login rate limit skipped:", message);
  }

  return null;
}

function makeLabel(prefix: string, requestId: string) {
  return `${prefix}-${requestId}`;
}

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headerStore.get("x-real-ip") ?? "unknown";
}

function getSafeReturnTo(value: string | undefined) {
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/vacancies")) return null;
    if (decoded.startsWith("//")) return null;
    if (decoded.includes("://")) return null;
    return decoded;
  } catch {
    return null;
  }
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
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email: identifier, password, remember, returnTo } = parsed.data;
  const safeReturnTo = getSafeReturnTo(returnTo);
  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const totalLabel = makeLabel("loginAction-total", requestId);
  if (process.env.NODE_ENV !== "production") {
    console.time(totalLabel);
  }

  try {
    const rateLimitError = await timed(
      makeLabel("login-rate-limit", requestId),
      async () => getLoginRateLimitError({ identifier, ipAddress }),
    );

    if (rateLimitError) {
      return rateLimitError;
    }

    const user = await timed(
      makeLabel("login-find-user", requestId),
      async () => {
        return retryTransientLoginDbOperation("login-find-user", () =>
          prisma.user.findUnique({
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
              termsAcceptedAt: true,
              deletedAt: true,
            },
          }),
        );
      },
    );

    if (!user || user.deletedAt) {
      return {
        success: false,
        error: INVALID_CREDENTIALS_MESSAGE,
      };
    }

    if (user.status === "SUSPENDED" || user.status === "DISABLED") {
      redirect(`/account-suspended?status=${encodeURIComponent(user.status)}`);
    }

    if (user.status !== "ACTIVE") {
      redirect("/account-suspended");
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
        await retryTransientLoginDbOperation("login-set-session", () =>
          setUserSession({
            userId: user.id,
            activeMembershipId: null,
            remember,
          }),
        );
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
          // Platform admins and super admins should not be forced to change
          // password via the login flow. Respect `safeReturnTo` or the
          // standard post-login redirect.
          safeReturnTo ??
          getRedirectAfterLogin({
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
        return retryTransientLoginDbOperation("login-load-membership", () =>
          prisma.membership.findFirst({
            where: {
              userId: user.id,
            },
            select: {
              id: true,
              orgId: true,
              role: true,
              scopeType: true,
              scopeId: true,
              org: {
                select: {
                  name: true,
                  status: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          }),
        );
      },
    );

    let tenant: { id: string; org: { name: string; status: string } } | null = null;

    if (!primaryMembership) {
      tenant = await timed(
        makeLabel("login-load-tenant", requestId),
        async () => {
          return retryTransientLoginDbOperation("login-load-tenant", () =>
            prisma.tenant.findFirst({
              where: {
                userId: user.id,
              },
              select: {
                id: true,
                org: {
                  select: {
                    name: true,
                    status: true,
                  },
                },
              },
            }),
          );
        },
      );
    }

    if (!primaryMembership && !tenant) {
      // If the account isn't linked to any organization or tenant yet,
      // send the user to the register/onboarding request page so they
      // can request access or start onboarding instead of showing an error.
      redirect("/register?request=needs-access#request-access");
    }

    if (primaryMembership && primaryMembership.org.status !== "ACTIVE") {
      const organizationName = primaryMembership.org.name;
      redirect(
        `/service-terminated?organization=${encodeURIComponent(organizationName)}`,
      );
    }

    if (tenant && tenant.org.status !== "ACTIVE") {
      const organizationName = tenant.org.name;
      redirect(
        `/service-terminated?organization=${encodeURIComponent(organizationName)}`,
      );
    }

    await timed(makeLabel("login-set-session", requestId), async () => {
      await retryTransientLoginDbOperation("login-set-session", () =>
        setUserSession({
          userId: user.id,
          activeMembershipId: primaryMembership?.id ?? null,
          remember,
        }),
      );
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
        || !user.termsAcceptedAt
          ? "/change-password"
          : safeReturnTo ??
            getRedirectAfterLogin({
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

    if (error instanceof ActiveSessionLimitError) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (isTransientDatabaseError(error)) {
      console.error("loginAction database unavailable:", error);

      return {
        success: false,
        error: DATABASE_UNAVAILABLE_MESSAGE,
      };
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
