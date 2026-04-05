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

  const membership = await prisma.membership.findFirst({
    where: {
      id: memberId,
      orgId,
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

  await prisma.user.update({
    where: { id: membership.userId },
    data: {
      fullName,
      email: email || null,
      phone: phone || null,
    },
  });

  await prisma.membership.update({
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

  revalidatePath("/staff");
  revalidatePath(`/staff/${membership.role.toLowerCase()}`);
  revalidatePath(`/staff/${String(role).toLowerCase()}`);
}