"use server";

import crypto from "node:crypto";
import { sendVerificationEmail } from "@/lib/notifications/email";
import { hashOpaqueToken } from "@/lib/crypto/tokens";
import { isValidTimezone, isValidPhone, normalizePhone } from "./_lib/form-validation";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  isTransientDatabaseError,
  retryTransientDatabaseOperation,
} from "@/lib/db/retry";
import { logServerError } from "@/lib/errors/server-error-log";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { isSupportedCurrency } from "@/lib/currencies";
import {
  resolveInitialSubscriptionStatus,
  type AppPlan,
} from "@/lib/billing/plans";

const createOrganizationSchema = z
  .object({
    onboardingRequestId: z.string().trim().max(100).optional(),
    organizationName: z.string().trim().min(2, "Organization name is required"),
    organizationSlug: z.string().trim().optional(),
    organizationEmail: z
      .string()
      .trim()
      .email("Enter a valid organization email")
      .optional()
      .or(z.literal("")),
    organizationPhone: z.string().trim().refine(isValidPhone, "Use international phone format").optional(),
    organizationAddress: z.string().trim().optional(),
    currencyCode: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine(isSupportedCurrency, "Select a supported East African or UAE currency"),
    timezone: z.string().trim().refine(isValidTimezone, "Choose a valid timezone"),
    dataRetentionDays: z.coerce
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than zero"),
    plan: z.enum(["FREE", "PRO", "PLUS", "ENTERPRISE"], {
      message: "Select a valid plan",
    }),
    accountType: z.enum(["PROPERTY_MANAGER", "LANDLORD"], {
      message: "Select a valid account type",
    }),

    adminFullName: z.string().trim().min(2, "Admin full name is required"),
    adminUsername: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Master username must be at least 3 characters")
      .max(30, "Master username must be 30 characters or fewer")
      .regex(
        /^[a-z0-9._-]+$/,
        "Use only letters, numbers, dots, underscores, and hyphens",
      ),
    adminEmail: z.string().trim().email("Enter a valid admin email"),
    adminPhone: z.string().trim().refine(isValidPhone, "Use international phone format").optional(),
    adminPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    adminPasswordConfirm: z.string().min(1, "Please confirm the password"),
  })
  .superRefine((data, ctx) => {
    if (data.adminPassword !== data.adminPasswordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["adminPasswordConfirm"],
        message: "Passwords do not match",
      });
    }
  });

export type CreateOrganizationState = {
  success: boolean;
  createdAccount?: { organizationName: string; slug: string; accountType: string; fullName: string; username: string; email: string; phone: string | null; plan: string; verificationSent?: boolean };
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const DATABASE_UNAVAILABLE_MESSAGE =
  "The database is taking too long to respond. Please try again in a moment.";
const GENERIC_CREATE_ERROR_MESSAGE =
  "Unable to create this organization right now. Please try again.";

function addAnnualPeriodEnd(start: Date) {
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  return end;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export async function createOrganizationAction(
  _prevState: CreateOrganizationState,
  formData: FormData,
): Promise<CreateOrganizationState> {
  try {
    const session = await requirePlatformRole(
      ["SUPER_ADMIN", "PLATFORM_ADMIN"],
      { redirectTo: "/login" },
    );

    const parsed = createOrganizationSchema.safeParse({
      onboardingRequestId: formData.get("onboardingRequestId") ?? "",
      organizationName: formData.get("organizationName"),
      organizationSlug: formData.get("organizationSlug"),
      organizationEmail: formData.get("organizationEmail"),
      organizationPhone: formData.get("organizationPhone"),
      organizationAddress: formData.get("organizationAddress"),
      currencyCode: formData.get("currencyCode"),
      timezone: formData.get("timezone"),
      dataRetentionDays: formData.get("dataRetentionDays"),
      plan: formData.get("plan"),
      accountType: formData.get("accountType"),

      adminFullName: formData.get("adminFullName"),
      adminUsername: formData.get("adminUsername"),
      adminEmail: formData.get("adminEmail"),
      adminPhone: formData.get("adminPhone"),
      adminPassword: formData.get("adminPassword"),
      adminPasswordConfirm: formData.get("adminPasswordConfirm"),
    });

    if (!parsed.success) {
      return {
        success: false,
        error: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;
    const slug = slugify(data.organizationSlug || data.organizationName);
    const adminPhone = normalizePhone(data.adminPhone ?? "") || null;
    const adminEmail = data.adminEmail.toLowerCase();

    if (!slug) {
      return {
        success: false,
        error: "A valid organization address could not be generated.", fieldErrors: { organizationSlug: ["Use letters or numbers in the workspace address."] },
      };
    }

    const [existingOrg, existingUser] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          prisma.organization.findFirst({
            where: {
              OR: [{ slug }, { name: data.organizationName, deletedAt: null }],
            },
            select: { id: true, slug: true, name: true },
          }),
          prisma.user.findFirst({
            where: {
              OR: [
                { username: data.adminUsername },
                { email: adminEmail },
                ...(adminPhone ? [{ phone: adminPhone }] : []),
              ],
            },
            select: { id: true, username: true, email: true, phone: true },
          }),
        ]),
      { label: "create-organization-uniqueness-check" },
    );

    if (existingOrg) {
      return {
        fieldErrors: { [existingOrg.slug === slug ? "organizationSlug" : "organizationName"]: ["Already in use. Choose a different value."] },
        success: false,
        error:
          existingOrg.slug === slug
            ? "An organization with this slug already exists."
            : "An organization with this name already exists.",
      };
    }

    if (existingUser) {
      if (existingUser.username === data.adminUsername) {
        return {
          success: false,
          error: "A user with this master username already exists.",
          fieldErrors: {
            adminUsername: ["Choose a different master username."],
          },
        };
      }

      if (existingUser.phone && existingUser.phone === adminPhone) {
        return {
          success: false,
          error: "A user with this master phone number already exists.",
          fieldErrors: {
            adminPhone: ["Use a different phone number or leave it blank."],
          },
        };
      }

      return {
        success: false,
        error: "A user with this admin email already exists.",
        fieldErrors: {
          adminEmail: ["Use a different email address."],
        },
      };
    }

    const passwordHash = await bcrypt.hash(data.adminPassword, 12);

    const token = crypto.randomBytes(32).toString("hex");
    await retryTransientDatabaseOperation(
      () =>
        prisma.$transaction(async (tx) => {
          if (data.onboardingRequestId) {
            const claimed = await tx.onboardingRequest.updateMany({ where: { id: data.onboardingRequestId, status: "QUALIFIED" }, data: { status: "CLOSED", handledAt: new Date(), handledByUserId: session.userId } });
            if (claimed.count !== 1) throw new Error("ONBOARDING_REQUEST_UNAVAILABLE");
          }
          const org = await tx.organization.create({
            data: {
              name: data.organizationName,
              slug,
              email: data.organizationEmail || null,
              phone: normalizePhone(data.organizationPhone ?? "") || null,
              address: data.organizationAddress || null,
              status: "ACTIVE",
              currencyCode: data.currencyCode.toUpperCase(),
              timezone: data.timezone,
              dataRetentionDays: data.dataRetentionDays,
            },
          });

          const adminUser = await tx.user.create({
            data: {
              fullName: data.adminFullName,
              username: data.adminUsername,
              email: adminEmail,
              phone: adminPhone,
              passwordHash,
              status: "ACTIVE",
              platformRole: "USER",
              mustChangePassword: true,
              emailVerified: null,
              phoneVerified: null,
              createdByUserId: session.userId,
            },
          });

          await tx.membership.create({
            data: {
              orgId: org.id,
              userId: adminUser.id,
              role: "ADMIN",
              scopeType: "ORG",
              scopeId: "ORG_SCOPE",
            },
          });

          if (data.accountType === "LANDLORD") {
            await tx.landlordProfile.create({
              data: {
                orgId: org.id,
                userId: adminUser.id,
                displayName: data.adminFullName,
                email: adminEmail,
                phone: adminPhone,
                notes: "Created with the organization master admin account.",
              },
            });
          }

          await tx.organizationSettings.create({
            data: {
              orgId: org.id,
              branding: {},
              features: {},
              customFields: {},
              notificationDefaults: {},
            },
          });

          await tx.emailVerificationToken.create({ data: { email: adminEmail, token: hashOpaqueToken(token, "email-verification"), expiresAt: new Date(Date.now() + 86400000) } });
          await tx.auditLog.create({ data: { orgId: org.id, actorUserId: session.userId, action: "ORGANIZATION_CREATED", entityType: "Organization", entityId: org.id, metadata: { plan: data.plan, accountType: data.accountType, ownerUserId: adminUser.id, onboardingRequestId: data.onboardingRequestId || null } } });
          const now = new Date();
          const trialEnd = new Date(now);
          trialEnd.setDate(trialEnd.getDate() + 14);
          const plan = data.plan as AppPlan;
          const subscriptionStatus = resolveInitialSubscriptionStatus(plan);
          const onTrial = subscriptionStatus === "TRIALING";

          await tx.subscription.create({
            data: {
              orgId: org.id,
              plan,
              status: subscriptionStatus,
              currentPeriodStart: now,
              currentPeriodEnd: onTrial ? trialEnd : addAnnualPeriodEnd(now),
              trialStartsAt: onTrial ? now : null,
              trialEndsAt: onTrial ? trialEnd : null,
              billingEmail: data.organizationEmail || data.adminEmail,
              metadata: {
                accountType: data.accountType,
                amountDue: plan === "FREE" ? 0 : undefined,
              },
            },
          });
        }),
      { label: "create-organization-transaction" },
    );

    let verificationSent = false;
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
      if (appUrl) { await sendVerificationEmail({ to: adminEmail, verifyUrl: `${appUrl}/verify-email?token=${token}` }); verificationSent = true; }
    } catch (error) { logServerError("createOrganizationAction.verification", error); }
    revalidatePath("/platform/organizations");
    revalidatePath("/platform");
    revalidatePath("/platform/onboarding");
    return {
      success: true,
      createdAccount: { organizationName: data.organizationName, slug, accountType: data.accountType, fullName: data.adminFullName, username: data.adminUsername, email: adminEmail, phone: adminPhone, plan: data.plan, verificationSent },
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (isTransientDatabaseError(error)) {
      logServerError("createOrganizationAction.database", error);

      return {
        success: false,
        error: DATABASE_UNAVAILABLE_MESSAGE,
      };
    }

    if (error instanceof Error && error.message === "ONBOARDING_REQUEST_UNAVAILABLE") return { success: false, error: "This onboarding request was already processed or is no longer qualified. Return to onboarding and review its status." };
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") return { success: false, error: "An account detail was just registered by another request. Check availability and try again." };
    logServerError("createOrganizationAction", error);

    return {
      success: false,
      error: GENERIC_CREATE_ERROR_MESSAGE,
    };
  }
}

export async function checkOrganizationAvailability(values: Record<string, string>): Promise<Record<string, string[]>> {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/login" });
  const parsed = z.object({ organizationName: z.string().trim().max(200), organizationSlug: z.string().trim().max(200), adminUsername: z.string().trim().toLowerCase().max(30), adminEmail: z.string().trim().toLowerCase().max(254), adminPhone: z.string().trim().max(40) }).safeParse(values);
  if (!parsed.success) return { organizationName: ["Check the length and format of the account details."] };
  values = parsed.data;
  const slug = slugify(values.organizationSlug || values.organizationName || "");
  const [orgs, users] = await Promise.all([
    prisma.organization.findMany({ where: { OR: [{ slug }, { name: values.organizationName || "", deletedAt: null }] }, select: { slug: true, name: true }, take: 2 }),
    prisma.user.findMany({ where: { OR: [{ username: values.adminUsername || "" }, { email: (values.adminEmail || "").toLowerCase() }, ...(values.adminPhone ? [{ phone: normalizePhone(values.adminPhone) }] : [])] }, select: { username: true, email: true, phone: true }, take: 3 }),
  ]);
  const errors: Record<string, string[]> = {};
  for (const org of orgs) { if (org.slug === slug) errors.organizationSlug = ["This workspace address is already in use."]; if (org.name === values.organizationName) errors.organizationName = ["This workspace name is already in use."]; }
  for (const user of users) { if (user.username === values.adminUsername) errors.adminUsername = ["Username already in use."]; if (user.email === values.adminEmail?.toLowerCase()) errors.adminEmail = ["Email already in use."]; if (values.adminPhone && user.phone === normalizePhone(values.adminPhone)) errors.adminPhone = ["Phone already in use."]; }
  return errors;
}
