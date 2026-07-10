"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { OrgRole as PrismaOrgRole, Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { sendAccountCredentials } from "@/lib/notifications/account-credentials";
import { isSupportedCurrency } from "@/lib/currencies";
import {
  STAFF_ROLES,
  type StaffRole,
} from "@/features/staff/constants/role-meta";

type AssignmentTargetType = "PROPERTY" | "BUILDING";

export type CreateMembershipState = {
  ok: boolean;
  message?: string;
  step?: number;
  field?: string;
};

function fail(
  message: string,
  step: number,
  field?: string,
): CreateMembershipState {
  return {
    ok: false,
    message,
    step,
    field,
  };
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function normalizeOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseSalary(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim().replace(/,/g, "");

  if (!text) return null;

  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.NaN;
}

function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

function normalizeAssignmentTargetType(
  value: string,
): AssignmentTargetType | null {
  const upper = value.trim().toUpperCase();

  if (upper === "PROPERTY") {
    return "PROPERTY";
  }

  if (upper === "BUILDING") {
    return "BUILDING";
  }

  return null;
}

export async function createMembership(
  _previousState: CreateMembershipState,
  formData: FormData,
): Promise<CreateMembershipState> {
  const orgId = await requireCurrentOrgId();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const roleRaw = String(formData.get("role") ?? "").trim().toUpperCase();
  const salaryAmount = parseSalary(formData.get("salaryAmount"));
  const salaryCurrency =
    String(formData.get("salaryCurrency") ?? "").trim().toUpperCase() || "KES";
  const educationLevel = normalizeOptional(formData.get("educationLevel"));
  const jobTitle = normalizeOptional(formData.get("jobTitle"));
  const nationalId = normalizeOptional(formData.get("nationalId"));
  const emergencyContact = normalizeOptional(formData.get("emergencyContact"));
  const staffProfileNotes = normalizeOptional(formData.get("staffProfileNotes"));

  const assignmentTargetType = normalizeAssignmentTargetType(
    String(formData.get("assignmentTargetType") ?? ""),
  );

  const assignmentPropertyId = String(
    formData.get("assignmentPropertyId") ?? "",
  ).trim();

  const assignmentBuildingId = String(
    formData.get("assignmentBuildingId") ?? "",
  ).trim();

  const assignmentNotes = String(formData.get("assignmentNotes") ?? "").trim();

  const assignmentIsPrimary =
    String(formData.get("assignmentIsPrimary") ?? "") === "on";

  if (!isStaffRole(roleRaw)) {
    return fail("Invalid staff role.", 0, "role");
  }

  const role = roleRaw;

  if (role === "CARETAKER" && !assignmentTargetType) {
    return fail(
      "Please select a property or apartment/block for this caretaker.",
      0,
      "assignmentTargetType",
    );
  }

  if (role !== "CARETAKER" && assignmentTargetType) {
    return fail("Only caretakers can be mapped to properties or apartments.", 0);
  }

  if (!fullName) {
    return fail("Full name is required.", 1, "fullName");
  }

  if (!username) {
    return fail("Username is required.", 1, "username");
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return fail(
      "Username must be 3-30 characters and can only contain letters, numbers, dots, underscores, and hyphens.",
      1,
      "username",
    );
  }

  if (!email) {
    return fail("Email is required.", 1, "email");
  }

  if (!phone) {
    return fail("Phone is required.", 1, "phone");
  }

  if (phone.length < 7) {
    return fail("Phone number looks too short.", 1, "phone");
  }

  if (!jobTitle) {
    return fail("Job title is required.", 1, "jobTitle");
  }

  if (!educationLevel) {
    return fail("Education level is required.", 1, "educationLevel");
  }

  if (salaryAmount === null) {
    return fail("Salary is required.", 1, "salaryAmount");
  }

  if (Number.isNaN(salaryAmount)) {
    return fail("Salary must be a valid positive number.", 1, "salaryAmount");
  }

  if (!isSupportedCurrency(salaryCurrency)) {
    return fail("Select a supported East African or UAE currency.", 1, "salaryCurrency");
  }

  if (!nationalId) {
    return fail("National ID / employee ID is required.", 1, "nationalId");
  }

  if (!emergencyContact) {
    return fail("Emergency contact is required.", 1, "emergencyContact");
  }

  if (!staffProfileNotes) {
    return fail("Staff profile notes are required.", 1, "staffProfileNotes");
  }

  if (password.length < 8) {
    return fail("Password must be at least 8 characters.", 2, "password");
  }

  if (password !== confirmPassword) {
    return fail("Passwords do not match.", 2, "confirmPassword");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }, ...(phone ? [{ phone }] : [])],
    },
    select: {
      username: true,
      email: true,
      phone: true,
    },
  });

  if (existingUser?.username === username) {
    return fail(
      "This username is already taken. Please use a different username.",
      1,
      "username",
    );
  }

  if (existingUser?.email === email) {
    return fail(
      "This email address is already used by another user. Please use a different email.",
      1,
      "email",
    );
  }

  if (existingUser?.phone === phone) {
    return fail(
      "This phone number is already used by another user. Use a different phone number.",
      1,
      "phone",
    );
  }

  const assignmentTarget =
    role === "CARETAKER" && assignmentTargetType
      ? await resolveCaretakerAssignmentTarget({
          orgId,
          targetType: assignmentTargetType,
          propertyId: assignmentPropertyId,
          buildingId: assignmentBuildingId,
        })
      : null;

  if (role === "CARETAKER" && assignmentTargetType && !assignmentTarget?.ok) {
    return fail(
      assignmentTarget?.message ?? "Caretaker mapping is invalid.",
      0,
      assignmentTarget?.field,
    );
  }

  const passwordHash = await hash(password, 12);
  const verifiedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          username,
          email,
          phone,
          status: UserStatus.ACTIVE,
          passwordHash,
          mustChangePassword: true,
          emailVerified: verifiedAt,
          phoneVerified: verifiedAt,
        },
        select: {
          id: true,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          orgId,
          role: role as PrismaOrgRole,
          scopeType: "ORG",
        },
        select: {
          id: true,
        },
      });

      await tx.staffProfile.create({
        data: {
          membershipId: membership.id,
          salaryAmount,
          salaryCurrency,
          educationLevel,
          jobTitle,
          nationalId,
          emergencyContact,
          notes: staffProfileNotes,
        },
      });

      if (role === "CARETAKER" && assignmentTarget?.ok) {
        await tx.caretakerAssignment.create({
          data: {
            orgId,
            caretakerUserId: user.id,
            propertyId: assignmentTarget.propertyId,
            buildingId: assignmentTarget.buildingId,
            unitId: assignmentTarget.unitId,
            isPrimary: assignmentIsPrimary,
            active: true,
            notes: assignmentNotes || null,
          },
        });
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(
        "A user with the same username, email, or phone already exists. Please change the duplicate value and try again.",
        1,
      );
    }

    return fail(
      "Something went wrong while creating this staff member. Please check the details and try again.",
      0,
    );
  }

  revalidatePath("/staff");
  revalidatePath(`/staff/${role.toLowerCase()}`);

  await sendAccountCredentials({
    fullName,
    username,
    password,
    email,
    phone,
    role,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login`,
  });

  redirect(`/staff/${role.toLowerCase()}`);
}

async function resolveCaretakerAssignmentTarget({
  orgId,
  targetType,
  propertyId,
  buildingId,
}: {
  orgId: string;
  targetType: AssignmentTargetType;
  propertyId: string;
  buildingId: string;
}): Promise<
  | {
      ok: true;
      propertyId: string;
      buildingId: string | null;
      unitId: string | null;
    }
  | {
      ok: false;
      message: string;
      field: string;
    }
> {
  if (targetType === "PROPERTY") {
    if (!propertyId) {
      return {
        ok: false,
        message: "Property is required for caretaker mapping.",
        field: "assignmentPropertyId",
      };
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        orgId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!property) {
      return {
        ok: false,
        message: "Selected property was not found.",
        field: "assignmentPropertyId",
      };
    }

    return {
      ok: true,
      propertyId: property.id,
      buildingId: null,
      unitId: null,
    };
  }

  if (targetType !== "BUILDING" || !buildingId) {
    return {
      ok: false,
      message: "Apartment/block is required for caretaker mapping.",
      field: "assignmentBuildingId",
    };
  }

  const building = await prisma.building.findFirst({
    where: {
      id: buildingId,
      deletedAt: null,
      isActive: true,
      property: {
        orgId,
        deletedAt: null,
        isActive: true,
      },
    },
    select: {
      id: true,
      propertyId: true,
    },
  });

  if (!building) {
    return {
      ok: false,
      message: "Selected apartment/block was not found.",
      field: "assignmentBuildingId",
    };
  }

  return {
    ok: true,
    propertyId: building.propertyId,
    buildingId: building.id,
    unitId: null,
  };
}
