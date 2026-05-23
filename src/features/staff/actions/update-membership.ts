"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";

export async function updateMembership(memberId: string, formData: FormData) {
  const orgId = await requireCurrentOrgId();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const salaryText = String(formData.get("salaryAmount") ?? "")
    .trim()
    .replace(/,/g, "");
  const salaryAmount = salaryText ? Number(salaryText) : null;
  const salaryCurrency =
    String(formData.get("salaryCurrency") ?? "").trim().toUpperCase() || "KES";
  const educationLevel =
    String(formData.get("educationLevel") ?? "").trim() || null;
  const jobTitle = String(formData.get("jobTitle") ?? "").trim() || null;
  const nationalId = String(formData.get("nationalId") ?? "").trim() || null;
  const emergencyContact =
    String(formData.get("emergencyContact") ?? "").trim() || null;
  const staffProfileNotes =
    String(formData.get("staffProfileNotes") ?? "").trim() || null;

  if (
    salaryText &&
    (salaryAmount === null || !Number.isFinite(salaryAmount) || salaryAmount < 0)
  ) {
    throw new Error("Salary must be a valid positive number.");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: memberId,
      orgId,
      employmentEndedAt: null,
    },
    select: {
      id: true,
      role: true,
      userId: true,
    },
  });

  if (!membership) {
    throw new Error("Member not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: membership.userId },
      data: {
        fullName,
        email: email || null,
        phone: phone || null,
      },
    });

    await tx.membership.update({
      where: { id: membership.id },
      data: {
        role: role as
          | "ADMIN"
          | "MANAGER"
          | "OFFICE"
          | "ACCOUNTANT"
          | "CARETAKER"
          | "TENANT",
      },
    });

    await tx.staffProfile.upsert({
      where: {
        membershipId: membership.id,
      },
      create: {
        membershipId: membership.id,
        salaryAmount,
        salaryCurrency,
        educationLevel,
        jobTitle,
        nationalId,
        emergencyContact,
        notes: staffProfileNotes,
      },
      update: {
        salaryAmount,
        salaryCurrency,
        educationLevel,
        jobTitle,
        nationalId,
        emergencyContact,
        notes: staffProfileNotes,
      },
    });
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${membership.role.toLowerCase()}`);
  revalidatePath(`/staff/${String(role).toLowerCase()}`);
}
