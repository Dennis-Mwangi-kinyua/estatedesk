"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";

export async function deleteUnitAction(formData: FormData) {
  const unitId = String(formData.get("unitId") ?? "").trim();

  if (!unitId) {
    throw new Error("Unit ID is required.");
  }

  const session = await requireManagementAccess();

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      deletedAt: null,
      property: {
        orgId: session.activeOrgId!,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      leases: {
        where: {
          deletedAt: null,
          status: {
            in: ["ACTIVE", "PENDING"],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!unit) {
    throw new Error("Unit not found.");
  }

  if (unit.leases.length > 0) {
    throw new Error(
      "Cannot delete a unit with an active or pending lease. Close or terminate the lease before deleting this unit.",
    );
  }

  await prisma.unit.update({
    where: { id: unit.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard/org/units");
  redirect(
    "/dashboard/org/units?message=Unit%20deleted%20successfully&messageType=success",
  );
}
