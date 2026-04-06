"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";

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
      .min(3, "Currency code must be 3 characters")
      .max(3, "Currency code must be 3 characters"),
    timezone: z.string().trim().min(1, "Timezone is required"),
    dataRetentionDays: z.coerce
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than zero"),
    plan: z.enum(["FREE", "PRO", "PLUS", "ENTERPRISE"], {
      message: "Select a valid plan",
    }),

    adminFullName: z.string().trim().min(2, "Admin full name is required"),
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

    adminFullName: formData.get("adminFullName"),
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

  if (!slug) {
    return {
      success: false,
      error: "A valid organization slug could not be generated.",
    };
  }

  const [existingOrg, existingUser] = await Promise.all([
    prisma.organization.findFirst({
      where: {
        OR: [{ slug }, { name: data.organizationName }],
      },
      select: { id: true, slug: true, name: true },
    }),
    prisma.user.findFirst({
      where: {
        email: data.adminEmail.toLowerCase(),
        deletedAt: null,
      },
      select: { id: true, email: true },
    }),
  ]);

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
    return {
      success: false,
      error: "A user with this admin email already exists.",
    };
  }

  const passwordHash = await bcrypt.hash(data.adminPassword, 12);

  await prisma.$transaction(async (tx) => {
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
        email: data.adminEmail.toLowerCase(),
        phone: data.adminPhone || null,
        passwordHash,
        status: "ACTIVE",
        platformRole: "USER",
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

    await tx.subscription.create({
      data: {
        orgId: org.id,
        plan: data.plan,
        status: "TRIALING",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStartsAt: now,
        trialEndsAt: trialEnd,
        billingEmail: data.organizationEmail || data.adminEmail,
      },
    });
  });

  redirect("/platform/organizations");
}