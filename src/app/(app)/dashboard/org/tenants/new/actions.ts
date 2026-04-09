"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type CreateTenantInput = {
  orgId: string;
  fullName: string;
  phone: string;
  email: string;
  nationalId: string | null;
  unitId: string;
  caretakerUserId: string | null;
  leaseStartDate: string;
  monthlyRent: string;
  deposit: string | null;
  passwordMode: "auto" | "manual";
  manualPassword: string | null;
};

type CreateTenantResult = {
  ok: boolean;
  message: string;
  tenantId?: string;
  temporaryCredentials?: {
    username: string;
    password: string;
  };
};

function generateTemporaryPassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password;
}

function buildUsername(email: string, fullName: string) {
  const base = email.includes("@")
    ? email.split("@")[0]
    : fullName.toLowerCase().trim().replace(/\s+/g, ".");

  return `${base.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase()}.${Date.now().toString().slice(-4)}`;
}

function parseMoney(value: string | null) {
  if (!value || !value.trim()) return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

export async function createTenantAction(
  input: CreateTenantInput,
): Promise<CreateTenantResult> {
  try {
    if (!input.fullName.trim()) {
      return { ok: false, message: "Full name is required." };
    }

    if (!input.phone.trim()) {
      return { ok: false, message: "Phone number is required." };
    }

    if (!input.email.trim()) {
      return { ok: false, message: "Email is required." };
    }

    if (!input.unitId) {
      return { ok: false, message: "Unit allocation is required." };
    }

    if (!input.leaseStartDate) {
      return { ok: false, message: "Lease start date is required." };
    }

    const monthlyRent = parseMoney(input.monthlyRent);
    if (monthlyRent === null) {
      return { ok: false, message: "Valid monthly rent is required." };
    }

    const deposit = parseMoney(input.deposit);

    const selectedUnit = await prisma.unit.findFirst({
      where: {
        id: input.unitId,
        deletedAt: null,
        isActive: true,
        status: "VACANT",
        property: {
          orgId: input.orgId,
          deletedAt: null,
          isActive: true,
        },
      },
      select: {
        id: true,
      },
    });

    if (!selectedUnit) {
      return { ok: false, message: "Selected unit is no longer available." };
    }

    const existingUserEmail = await prisma.user.findFirst({
      where: {
        email: input.email.trim(),
      },
      select: {
        id: true,
      },
    });

    if (existingUserEmail) {
      return { ok: false, message: "A user with this email already exists." };
    }

    const existingUserPhone = await prisma.user.findFirst({
      where: {
        phone: input.phone.trim(),
      },
      select: {
        id: true,
      },
    });

    if (existingUserPhone) {
      return { ok: false, message: "A user with this phone number already exists." };
    }

    const existingTenantPhone = await prisma.tenant.findFirst({
      where: {
        orgId: input.orgId,
        phone: input.phone.trim(),
      },
      select: {
        id: true,
      },
    });

    if (existingTenantPhone) {
      return { ok: false, message: "A tenant with this phone number already exists." };
    }

    const existingTenantEmail = await prisma.tenant.findFirst({
      where: {
        orgId: input.orgId,
        email: input.email.trim(),
      },
      select: {
        id: true,
      },
    });

    if (existingTenantEmail) {
      return { ok: false, message: "A tenant with this email already exists." };
    }

    const plainPassword =
      input.passwordMode === "manual"
        ? input.manualPassword?.trim() ?? ""
        : generateTemporaryPassword(8);

    if (plainPassword.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }

    const username = buildUsername(input.email.trim(), input.fullName.trim());
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          fullName: input.fullName.trim(),
          phone: input.phone.trim(),
          email: input.email.trim(),
          passwordHash,
          status: "ACTIVE",
          platformRole: "USER",
        },
        select: {
          id: true,
          username: true,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          orgId: input.orgId,
          userId: user.id,
          fullName: input.fullName.trim(),
          phone: input.phone.trim(),
          email: input.email.trim(),
          nationalId: input.nationalId?.trim() || null,
          status: "ACTIVE",
        },
        select: {
          id: true,
        },
      });

      await tx.lease.create({
        data: {
          orgId: input.orgId,
          unitId: input.unitId,
          tenantId: tenant.id,
          caretakerUserId: input.caretakerUserId,
          startDate: new Date(input.leaseStartDate),
          monthlyRent,
          deposit,
          status: "ACTIVE",
        },
      });

      await tx.unit.update({
        where: {
          id: input.unitId,
        },
        data: {
          status: "OCCUPIED",
        },
      });

      return {
        tenantId: tenant.id,
        username: user.username ?? username,
      };
    });

    revalidatePath("/dashboard/org/tenants");
    revalidatePath("/dashboard/org/tenants/new");

    return {
      ok: true,
      message: "Tenant registered successfully.",
      tenantId: created.tenantId,
      temporaryCredentials: {
        username: created.username,
        password: plainPassword,
      },
    };
  } catch (error) {
    console.error("createTenantAction error:", error);

    return {
      ok: false,
      message: "Failed to register tenant. Please try again.",
    };
  }
}