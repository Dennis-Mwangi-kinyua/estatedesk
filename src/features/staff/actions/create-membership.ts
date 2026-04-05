"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import bcrypt from "bcryptjs";

export async function createMembership(formData: FormData) {
  const orgId = await requireCurrentOrgId();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as
    | "ADMIN"
    | "MANAGER"
    | "OFFICE"
    | "ACCOUNTANT"
    | "CARETAKER"
    | "TENANT";

  if (!fullName || !role) {
    throw new Error("Full name and role are required");
  }

  const temporaryPassword = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email: email || null,
      phone: phone || null,
      status: "ACTIVE",
      passwordHash,
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      orgId,
      role,
      scopeType: "ORG",
    },
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${role.toLowerCase()}`);
}