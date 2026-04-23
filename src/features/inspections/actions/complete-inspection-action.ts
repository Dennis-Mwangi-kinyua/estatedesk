"use server";

import {
  NotificationChannel,
  NotificationType,
  NoticeStatus,
  OrgRole,
  Prisma,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { requireCurrentOrgId } from "@/lib/auth/org";

export async function completeInspectionAction(formData: FormData) {
  const session = await requireUserSession();
  const orgId = await requireCurrentOrgId();

  if (session.activeOrgRole !== "CARETAKER") {
    throw new Error("Only caretakers can complete inspections.");
  }

  const inspectionId = String(formData.get("inspectionId") ?? "").trim();

  if (!inspectionId) {
    throw new Error("Inspection id is required.");
  }

  const allocations = await prisma.caretakerAssignment.findMany({
    where: {
      orgId,
      caretakerUserId: session.userId,
      active: true,
    },
    select: {
      propertyId: true,
      buildingId: true,
      unitId: true,
    },
  });

  const propertyIds = allocations
    .map((item) => item.propertyId)
    .filter((value): value is string => Boolean(value));

  const buildingIds = allocations
    .map((item) => item.buildingId)
    .filter((value): value is string => Boolean(value));

  const unitIds = allocations
    .map((item) => item.unitId)
    .filter((value): value is string => Boolean(value));

  const allocationFilters: Prisma.InspectionWhereInput[] = [
    {
      notice: {
        lease: {
          caretakerUserId: session.userId,
        },
      },
    },
  ];

  if (unitIds.length > 0) {
    allocationFilters.push({
      notice: {
        lease: {
          unitId: {
            in: unitIds,
          },
        },
      },
    });
  }

  if (buildingIds.length > 0) {
    allocationFilters.push({
      notice: {
        lease: {
          unit: {
            buildingId: {
              in: buildingIds,
            },
          },
        },
      },
    });
  }

  if (propertyIds.length > 0) {
    allocationFilters.push({
      notice: {
        lease: {
          unit: {
            propertyId: {
              in: propertyIds,
            },
          },
        },
      },
    });
  }

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      AND: [
        {
          notice: {
            lease: {
              orgId,
              deletedAt: null,
            },
          },
        },
        {
          OR: allocationFilters,
        },
      ],
    },
    include: {
      notice: {
        select: {
          id: true,
          tenant: {
            select: {
              fullName: true,
            },
          },
          lease: {
            select: {
              unit: {
                select: {
                  houseNo: true,
                  property: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!inspection) {
    throw new Error("Inspection not found or not allocated to you.");
  }

  if (inspection.status === "COMPLETED") {
    redirect(`/dashboard/caretaker/inspections/${inspectionId}`);
  }

  const summary = String(formData.get("summary") ?? "").trim();
  const recommendations = String(formData.get("recommendations") ?? "").trim();

  if (!summary) {
    throw new Error("Inspection summary is required.");
  }

  const submittedAt = new Date();

  const checklist = {
    cleanlinessOk: formData.get("cleanlinessOk") === "on",
    wallsOk: formData.get("wallsOk") === "on",
    doorsWindowsOk: formData.get("doorsWindowsOk") === "on",
    plumbingOk: formData.get("plumbingOk") === "on",
    electricalOk: formData.get("electricalOk") === "on",
    keysReturned: formData.get("keysReturned") === "on",
    meterReadingsTaken: formData.get("meterReadingsTaken") === "on",
    damageObserved: formData.get("damageObserved") === "on",
    summary,
    recommendations,
    submittedAt: submittedAt.toISOString(),
    submittedByUserId: session.userId,
  };

  const officeRecipients = await prisma.membership.findMany({
    where: {
      orgId,
      role: {
        in: [OrgRole.OFFICE, OrgRole.ADMIN],
      },
      user: {
        deletedAt: null,
      },
    },
    distinct: ["userId"],
    select: {
      userId: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.inspection.update({
      where: {
        id: inspection.id,
      },
      data: {
        status: "COMPLETED",
        checklist,
        notes: summary,
        completedAt: submittedAt,
      },
    });

    await tx.moveOutNotice.update({
      where: {
        id: inspection.notice.id,
      },
      data: {
        status: NoticeStatus.INSPECTION_COMPLETED,
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        actorUserId: session.userId,
        action: "INSPECTION_COMPLETED",
        entityType: "Inspection",
        entityId: inspection.id,
        metadata: {
          tenantName: inspection.notice.tenant.fullName,
          propertyName: inspection.notice.lease.unit.property.name,
          unit: inspection.notice.lease.unit.houseNo,
        },
      },
    });

    if (officeRecipients.length > 0) {
      await tx.notification.createMany({
        data: officeRecipients.map((recipient) => ({
          orgId,
          userId: recipient.userId,
          channel: NotificationChannel.IN_APP,
          type: NotificationType.GENERAL,
          title: "Inspection report submitted",
          message: `Inspection report submitted for ${inspection.notice.tenant.fullName} at ${inspection.notice.lease.unit.property.name}, unit ${inspection.notice.lease.unit.houseNo}.`,
        })),
      });
    }
  });

  revalidatePath("/dashboard/caretaker/inspections");
  revalidatePath(`/dashboard/caretaker/inspections/${inspectionId}`);
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/move-outs");

  redirect(`/dashboard/caretaker/inspections/${inspectionId}`);
}