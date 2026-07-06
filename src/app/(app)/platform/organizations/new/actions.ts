"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
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
    organizationName: z.string().trim().min(2, "Organization name is required"),
    organizationSlug: z.string().trim().optional(),
    organizationEmail: z
      .string()
      .trim()
      .email("Enter a valid organization email")
      .optional()
      .or(z.literal("")),
    organizationPhone: z.string().trim().optional(),
    organizationAddress: z.string().trim().optional(),
    currencyCode: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine(isSupportedCurrency, "Select a supported East African or UAE currency"),
    timezone: z.string().trim().min(1, "Timezone is required"),
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
    adminPhone: z.string().trim().optional(),
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
    const adminPhone = (data.adminPhone ?? "").replace(/\s+/g, "") || null;
    const adminEmail = data.adminEmail.toLowerCase();

    if (!slug) {
      return {
        success: false,
        error: "A valid organization slug could not be generated.",
      };
    }

    const [existingOrg, existingUser] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          prisma.organization.findFirst({
            where: {
              deletedAt: null,
              OR: [{ slug }, { name: data.organizationName }],
            },
            select: { id: true, slug: true, name: true },
          }),
          prisma.user.findFirst({
            where: {
              deletedAt: null,
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

    await retryTransientDatabaseOperation(
      () =>
        prisma.$transaction(async (tx) => {
          const org = await tx.organization.create({
            data: {
              name: data.organizationName,
              slug,
              email: data.organizationEmail || null,
              phone: data.organizationPhone || null,
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
              emailVerified: new Date(),
              phoneVerified: adminPhone ? new Date() : null,
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

    redirect("/platform/organizations");
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

    logServerError("createOrganizationAction", error);

    return {
      success: false,
      error: GENERIC_CREATE_ERROR_MESSAGE,
    };
  }
}
