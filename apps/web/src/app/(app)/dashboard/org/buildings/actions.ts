"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";

export async function deleteBuildingAction(formData: FormData) {
  const buildingId = String(formData.get("buildingId") ?? "").trim();

  if (!buildingId) {
    throw new Error("Building ID is required.");
  }

  const session = await requireManagementAccess();

  const building = await prisma.building.findFirst({
    where: {
      id: buildingId,
      deletedAt: null,
      property: {
        orgId: session.activeOrgId!,
        deletedAt: null,
      },
    },
    select: {
      id: true,
    },
  });

  if (!building) {
    throw new Error("Building not found.");
  }

  const activeLeaseCount = await prisma.lease.count({
    where: {
      deletedAt: null,
      status: {
        in: ["ACTIVE", "PENDING"],
      },
      unit: {
        buildingId: building.id,
        deletedAt: null,
        property: {
          orgId: session.activeOrgId!,
          deletedAt: null,
        },
      },
    },
  });

  if (activeLeaseCount > 0) {
    throw new Error(
      "Cannot delete a building with units that have active or pending leases. Close leases before deleting this building.",
    );
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.building.update({
      where: { id: building.id },
      data: { deletedAt: now },
    });

    await tx.unit.updateMany({
      where: {
        buildingId: building.id,
        deletedAt: null,
      },
      data: { deletedAt: now },
    });
  });

  revalidatePath("/dashboard/org/buildings");
  redirect(
    "/dashboard/org/buildings?message=Building%20deleted%20successfully&messageType=success",
  );
}
