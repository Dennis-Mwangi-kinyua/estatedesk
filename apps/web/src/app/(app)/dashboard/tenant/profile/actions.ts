"use server";

import { changeAccountPasswordAction } from "@/features/security/password-action";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { ensureTenantIdentity } from "@/lib/tenants/identity";

export type VerifyTenantPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export type ProfileActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

export async function verifyTenantPassword(
  password: string,
): Promise<VerifyTenantPasswordResult> {
  try {
    const session = await requireTenantAccess();

    if (!session.userId) {
      return { ok: false, error: "Unauthorized." };
    }

    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      return { ok: false, error: "Password is required." };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        passwordHash: true,
        deletedAt: true,
        status: true,
      },
    });

    if (!user || user.deletedAt) {
      return { ok: false, error: "User account not found." };
    }

    if (user.status !== "ACTIVE") {
      return { ok: false, error: "Your account is not active." };
    }

    const isValid = await bcrypt.compare(trimmedPassword, user.passwordHash);

    if (!isValid) {
      return { ok: false, error: "Incorrect password." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to verify password right now." };
  }
}

function normalizeOptionalEmail(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateTenantProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const session = await requireTenantAccess();

    if (!session.userId || !session.activeOrgId) {
      return { ok: false, error: "Missing tenant session context." };
    }

    const phone = String(formData.get("phone") ?? "").trim();
    const email = normalizeOptionalEmail(formData.get("email"));
    const nextOfKinName = String(formData.get("nextOfKinName") ?? "").trim();
    const nextOfKinRelationship = String(
      formData.get("nextOfKinRelationship") ?? "",
    ).trim();
    const nextOfKinPhone = String(formData.get("nextOfKinPhone") ?? "").trim();
    const nextOfKinEmail = normalizeOptionalEmail(formData.get("nextOfKinEmail"));

    if (!phone) {
      return { ok: false, error: "Phone number is required." };
    }

    if (phone.length > 30) {
      return { ok: false, error: "Phone number is too long." };
    }

    if (email && email.length > 120) {
      return { ok: false, error: "Email is too long." };
    }

    if (!nextOfKinName) {
      return { ok: false, error: "Next of kin name is required." };
    }

    if (!nextOfKinRelationship) {
      return { ok: false, error: "Next of kin relationship is required." };
    }

    if (!nextOfKinPhone) {
      return { ok: false, error: "Next of kin phone is required." };
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        userId: session.userId,
        orgId: session.activeOrgId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        nationalId: true,
        kraPin: true,
      },
    });

    if (!tenant) {
      return { ok: false, error: "Tenant profile not found." };
    }

    const duplicateTenant = await prisma.tenant.findFirst({
      where: {
        orgId: session.activeOrgId,
        id: { not: tenant.id },
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
      select: { id: true },
    });

    if (duplicateTenant) {
      return {
        ok: false,
        error:
          "Another tenant in this organisation already uses that phone or email.",
      };
    }

    const duplicateUser = await prisma.user.findFirst({
      where: {
        id: { not: session.userId },
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
      select: { id: true },
    });

    if (duplicateUser) {
      return {
        ok: false,
        error: "Another account already uses that phone or email.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.userId! },
        data: {
          phone,
          email,
        },
      });

      await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          phone,
          email,
          nextOfKin: {
            upsert: {
              create: {
                name: nextOfKinName,
                relationship: nextOfKinRelationship,
                phone: nextOfKinPhone,
                email: nextOfKinEmail,
              },
              update: {
                name: nextOfKinName,
                relationship: nextOfKinRelationship,
                phone: nextOfKinPhone,
                email: nextOfKinEmail,
              },
            },
          },
        },
      });

      await ensureTenantIdentity(tx, {
        tenantId: tenant.id,
        fullName: tenant.fullName,
        phone,
        email,
        nationalId: tenant.nationalId,
        kraPin: tenant.kraPin,
      });
    });

    revalidatePath("/dashboard/tenant/profile");
    revalidatePath("/dashboard/tenant/profile/edit");
    revalidatePath("/dashboard/tenant");

    return {
      ok: true,
      message: "Profile updated successfully.",
    };
  } catch {
    return {
      ok: false,
      error: "Unable to update your profile right now. Please try again.",
    };
  }
}

export async function updateTenantPasswordAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    await requireTenantAccess();
    const result = await changeAccountPasswordAction({ ok: false }, formData);
    if (!result.ok) return result;
    redirect("/dashboard/tenant/profile?passwordUpdated=1");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { ok: false, error: "Unable to update your password right now. Please try again." };
  }
}
