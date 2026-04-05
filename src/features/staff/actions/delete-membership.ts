"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";

export async function deleteMembership(memberId: string) {
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

  await prisma.membership.delete({
    where: { id: membership.id },
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${membership.role.toLowerCase()}`);
}