"use server";

import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma, TenantStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

const ALLOWED_STATUSES: TenantStatus[] = ["ACTIVE", "INACTIVE", "BLACKLISTED"];

type CreateTenantActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  credentials?: {
    tenantName: string;
    username: string;
    password: string;
  };
};

function toOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRequiredString(
  value: FormDataEntryValue | null,
  fieldLabel: string,
): string {
  const parsed = toOptionalString(value);

  if (!parsed) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return parsed;
}

function toNonNegativeDecimal(
  value: string | null,
  fieldLabel: string,
): Prisma.Decimal | null {
  if (!value) return null;

  const asNumber = Number(value);

  if (Number.isNaN(asNumber)) {
    throw new Error(`${fieldLabel} must be a valid number.`);
  }

  if (asNumber < 0) {
    throw new Error(`${fieldLabel} cannot be negative.`);
  }

  return new Prisma.Decimal(value);
}

function toOptionalInt(value: string | null, fieldLabel: string): number | null {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldLabel} must be a whole number.`);
  }

  return parsed;
}

function slugifyUsernameBase(fullName: string) {
  const normalized = fullName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 18);

  return normalized || "tenant";
}

function generatePassword(length = 10) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let password = "";

  for (let index = 0; index < length; index += 1) {
    password += alphabet[bytes[index] % alphabet.length];
  }

  return password;
}

async function generateUniqueUsername(
  tx: Prisma.TransactionClient,
  fullName: string,
) {
  const base = slugifyUsernameBase(fullName);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix =
      attempt === 0 ? "" : `${Math.floor(1000 + Math.random() * 9000)}`;
    const candidate = `${base}${suffix}`;

    const existing = await tx.user.findFirst({
      where: {
        username: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}${Date.now().toString().slice(-6)}`;
}

async function getAuthorizedOrgContext(
  userId: string,
  activeOrgId?: string | null,
) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      orgId: activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
    },
  });

  if (membership) return membership;

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      orgId: true,
    },
  });

  if (!fallbackMembership) {
    throw new Error("No active organisation was found for your account.");
  }

  return fallbackMembership;
}

export async function createTenantAction(
  _prevState: CreateTenantActionState,
  formData: FormData,
): Promise<CreateTenantActionState> {
  try {
    const session = await requireUserSession();
    const membership = await getAuthorizedOrgContext(
      session.userId,
      session.activeOrgId,
    );

    const orgId = membership.orgId;

    const fullName = toRequiredString(formData.get("fullName"), "Full name");
    const phone = toRequiredString(formData.get("phone"), "Phone");
    const email = toOptionalString(formData.get("email"));
    const nationalId = toOptionalString(formData.get("nationalId"));
    const kraPin = toOptionalString(formData.get("kraPin"));
    const notes = toOptionalString(formData.get("notes"));
    const unitId = toOptionalString(formData.get("unitId"));
    const leaseStartDateRaw = toOptionalString(formData.get("leaseStartDate"));
    const dueDayRaw = toOptionalString(formData.get("dueDay"));
    const monthlyRentRaw = toOptionalString(formData.get("monthlyRent"));
    const depositRaw = toOptionalString(formData.get("deposit"));
    const statusRaw = toRequiredString(formData.get("status"), "Status");

    const nextOfKinName = toRequiredString(
      formData.get("nextOfKinName"),
      "Next of kin name",
    );
    const nextOfKinRelationship = toRequiredString(
      formData.get("nextOfKinRelationship"),
      "Next of kin relationship",
    );
    const nextOfKinPhone = toRequiredString(
      formData.get("nextOfKinPhone"),
      "Next of kin phone",
    );
    const nextOfKinEmail = toOptionalString(formData.get("nextOfKinEmail"));

    if (!ALLOWED_STATUSES.includes(statusRaw as TenantStatus)) {
      throw new Error("Please choose a valid tenant status.");
    }

    if (fullName.length > 120) {
      throw new Error("Full name is too long.");
    }

    if (phone.length > 30) {
      throw new Error("Phone number is too long.");
    }

    if (email && email.length > 120) {
      throw new Error("Email is too long.");
    }

    const dueDay = toOptionalInt(dueDayRaw, "Rent due day");
    if (dueDay !== null && (dueDay < 1 || dueDay > 31)) {
      throw new Error("Rent due day must be between 1 and 31.");
    }

    const monthlyRent = toNonNegativeDecimal(monthlyRentRaw, "Monthly rent");
    const deposit = toNonNegativeDecimal(depositRaw, "Deposit");

    const leaseStartDate = leaseStartDateRaw
      ? new Date(leaseStartDateRaw)
      : new Date();

    if (Number.isNaN(leaseStartDate.getTime())) {
      throw new Error("Lease start date is invalid.");
    }

    if (unitId && statusRaw !== "ACTIVE") {
      throw new Error(
        "A tenant must be Active if you want to assign a unit during creation.",
      );
    }

    const generatedPassword = generatePassword(10);

    const result = await prisma.$transaction(async (tx) => {
      const duplicateTenant = await tx.tenant.findFirst({
        where: {
          orgId,
          OR: [{ phone }, ...(email ? [{ email }] : [])],
        },
        select: {
          id: true,
        },
      });

      if (duplicateTenant) {
        throw new Error(
          "A tenant with the same phone or email already exists in this organisation.",
        );
      }

      const duplicateUser = await tx.user.findFirst({
        where: {
          OR: [{ phone }, ...(email ? [{ email }] : [])],
        },
        select: {
          id: true,
        },
      });

      if (duplicateUser) {
        throw new Error(
          "A user account with the same phone or email already exists.",
        );
      }

      const username = await generateUniqueUsername(tx, fullName);
      const passwordHash = await hash(generatedPassword, 10);

      const user = await tx.user.create({
        data: {
          fullName,
          phone,
          email,
          username,
          passwordHash,
          status: "ACTIVE",
          platformRole: "USER",
        },
        select: {
          id: true,
          username: true,
        },
      });

      await tx.membership.create({
        data: {
          orgId,
          userId: user.id,
          role: "TENANT",
          scopeType: "ORG",
          scopeId: "ORG_SCOPE",
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          orgId,
          userId: user.id,
          fullName,
          phone,
          email,
          nationalId,
          kraPin,
          notes,
          status: statusRaw as TenantStatus,
          nextOfKin: {
            create: {
              name: nextOfKinName,
              relationship: nextOfKinRelationship,
              phone: nextOfKinPhone,
              email: nextOfKinEmail,
            },
          },
        },
        select: {
          id: true,
          fullName: true,
        },
      });

      if (unitId) {
        const unit = await tx.unit.findFirst({
          where: {
            id: unitId,
            deletedAt: null,
            isActive: true,
            status: "VACANT",
            property: {
              orgId,
              deletedAt: null,
            },
          },
          select: {
            id: true,
            rentAmount: true,
            depositAmount: true,
          },
        });

        if (!unit) {
          throw new Error(
            "The selected unit is no longer available for mapping.",
          );
        }

        const effectiveMonthlyRent = monthlyRent ?? unit.rentAmount;
        const effectiveDeposit = deposit ?? unit.depositAmount ?? null;

        await tx.lease.create({
          data: {
            orgId,
            unitId: unit.id,
            tenantId: tenant.id,
            startDate: leaseStartDate,
            dueDay: dueDay ?? 5,
            monthlyRent: effectiveMonthlyRent,
            deposit: effectiveDeposit,
            status: "ACTIVE",
          },
        });

        await tx.unit.update({
          where: {
            id: unit.id,
          },
          data: {
            status: "OCCUPIED",
            vacantSince: null,
          },
        });
      }

      return {
        tenantName: tenant.fullName,
        username: user.username ?? username,
      };
    });

    revalidatePath("/dashboard/org/tenants");
    revalidatePath("/dashboard/org/units");
    revalidatePath("/dashboard/org/properties");
    revalidatePath("/dashboard/org");

    return {
      status: "success",
      message: "Tenant account created successfully.",
      credentials: {
        tenantName: result.tenantName,
        username: result.username,
        password: generatedPassword,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    return {
      status: "error",
      message: "Failed to create tenant account.",
    };
  }
}