"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { requireOrgPermission } from "@/lib/permissions/guards";

export async function deleteMembership(memberId: string) {
  const session = await requireOrgPermission("org.users.delete");
  const orgId = await requireCurrentOrgId();

  const membership = await prisma.membership.findFirst({
    where: {
      id: memberId,
      orgId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!membership) {
    throw new Error("Member not found");
  }

  if (membership.role === "ADMIN" && session.activeOrgRole !== "ADMIN") throw new Error("Only an organisation admin can remove an admin account.");

  await prisma.membership.delete({
    where: { id: membership.id },
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${membership.role.toLowerCase()}`);
}
