"use server";

import {
  NotificationChannel,
  NotificationType,
  NoticeStatus,
  OrgRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { notifyRecipients } from "@/lib/notifications/notify";
import { encodePublicId } from "@/lib/public-id";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { canInspectUnit } from "@/lib/move-outs/inspection-scope";
import { inspectionChecklistFields } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/constants";
import { uploadInspectionPhoto } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/upload-inspection-photo";

export async function completeInspectionAction(formData: FormData) {
  const session = await requireUserSession();
  const orgId = await requireCurrentOrgId();

  const inspectionId = String(formData.get("inspectionId") ?? "").trim();
  if (!inspectionId) throw new Error("Inspection id is required.");
  const memberships = await prisma.membership.findMany({ where: { orgId, userId: session.userId, role: { not: "TENANT" }, employmentEndedAt: null, deactivatedAt: null, user: { deletedAt: null, status: "ACTIVE" } } });

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      notice: { lease: { orgId, deletedAt: null } },
    },
    include: {
      notice: {
        select: {
          id: true,
          status: true,
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
          lease: {
            select: {
              id: true,
              unit: {
                select: {
                  id: true,
                  propertyId: true,
                  buildingId: true,
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

  if (!canInspectUnit(memberships, inspection.notice.lease.unit)) throw new Error("This inspection is outside your organisation scope.");
  if (inspection.status !== "SCHEDULED" || inspection.notice.status !== "INSPECTION_SCHEDULED") throw new Error("Only scheduled inspections can be reported. Refresh this inspection.");
  for (const field of inspectionChecklistFields) {
    if (!["yes", "no"].includes(String(formData.get(field.name)))) {
      throw new Error(`Choose a result for ${field.label}.`);
    }
  }

  const summary = String(formData.get("summary") ?? "").trim();
  const recommendations = String(formData.get("recommendations") ?? "").trim();

  if (!summary || summary.length > 2000 || recommendations.length > 2000) {
    throw new Error("Add a summary and keep report notes under 2,000 characters.");
  }

  const uploads = Array.from(formData.values()).filter((value): value is File => value instanceof File && value.size > 0);
  if (uploads.reduce((total, file) => total + file.size, 0) > 3 * 1024 * 1024) throw new Error("Keep all inspection photos under 3MB in total.");
  const yes = (key: string) => ["yes", "on"].includes(String(formData.get(key)));
  if (yes("damageObserved") && !recommendations) throw new Error("Describe the damage and recommended repairs before submitting.");
  const submittedAt = new Date();
  const roomPhotos: Record<string, string> = {};
  const checkInLatitude = String(formData.get("checkInLatitude") ?? "").trim();
  const checkInLongitude = String(formData.get("checkInLongitude") ?? "").trim();
  const checkInCapturedAt = String(formData.get("checkInCapturedAt") ?? "").trim();
  const checkInPhoto = formData.get("checkInPhoto");

  for (const field of inspectionChecklistFields) {
    const photo = formData.get(`photo_${field.name}`);

    if (photo instanceof File && photo.size > 0) {
      if (!photo.type.startsWith("image/")) {
        throw new Error(`Upload an image for ${field.label}.`);
      }

      if (photo.size > 2 * 1024 * 1024) {
        throw new Error(`Photo for ${field.label} must be 2MB or smaller.`);
      }

      roomPhotos[field.name] = await uploadInspectionPhoto({
        photo,
        inspectionId: inspection.id,
        roomKey: field.name,
        unitId: inspection.notice.lease.unit.id,
        orgId,
        submittedByUserId: session.userId,
      });
    }
  }

  let checkInPhotoAssetId: string | undefined;

  if (checkInPhoto instanceof File && checkInPhoto.size > 0) {
    if (!checkInPhoto.type.startsWith("image/")) {
      throw new Error("Upload an image for on-site check-in.");
    }

    checkInPhotoAssetId = await uploadInspectionPhoto({
      photo: checkInPhoto,
      inspectionId: inspection.id,
      roomKey: "check_in",
      unitId: inspection.notice.lease.unit.id,
      orgId,
      submittedByUserId: session.userId,
    });
  }

  const checklist = {
    cleanlinessOk: yes("cleanlinessOk"),
    wallsOk: yes("wallsOk"),
    doorsWindowsOk: yes("doorsWindowsOk"),
    plumbingOk: yes("plumbingOk"),
    electricalOk: yes("electricalOk"),
    keysReturned: yes("keysReturned"),
    meterReadingsTaken: yes("meterReadingsTaken"),
    damageObserved: yes("damageObserved"),
    summary,
    recommendations,
    roomPhotos,
    checkIn:
      checkInLatitude && checkInLongitude
        ? {
            latitude: Number(checkInLatitude),
            longitude: Number(checkInLongitude),
            capturedAt: checkInCapturedAt || submittedAt.toISOString(),
            photoAssetId: checkInPhotoAssetId ?? null,
          }
        : null,
    submittedAt: submittedAt.toISOString(),
    submittedByUserId: session.userId,
  };

  const officeRecipients = await prisma.membership.findMany({
    where: {
      orgId,
      employmentEndedAt: null,
      deactivatedAt: null,
      role: {
        in: [OrgRole.OFFICE, OrgRole.ADMIN, OrgRole.MANAGER],
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
    const reportSaved = await tx.inspection.updateMany({
      where: { id: inspection.id, status: "SCHEDULED" },
      data: {
        status: "COMPLETED",
        checklist,
        notes: summary,
        completedAt: submittedAt,
      },
    });

    if (reportSaved.count !== 1) throw new Error("This inspection has already changed. Refresh and try again.");
    const noticeSaved = await tx.moveOutNotice.updateMany({
      where: { id: inspection.notice.id, status: "INSPECTION_SCHEDULED" },
      data: {
        status: NoticeStatus.INSPECTION_COMPLETED,
      },
    });

    if (noticeSaved.count !== 1) throw new Error("This move-out notice is no longer awaiting inspection.");

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
          roomPhotoCount: Object.keys(roomPhotos).length,
          checkInCaptured: Boolean(checkInLatitude && checkInLongitude),
        },
      },
    });

    await notifyRecipients({ actorUserId: session.userId,
      db: tx,
      orgId,
      recipients: [...officeRecipients.map(recipient => ({ userId: recipient.userId })), { tenantId: inspection.notice.tenant.id }],
      channels: [NotificationChannel.IN_APP],
      type: NotificationType.GENERAL,
      title: "Inspection report submitted",
      message: `Inspection report submitted for ${inspection.notice.tenant.fullName} at ${inspection.notice.lease.unit.property.name}, unit ${inspection.notice.lease.unit.houseNo}.`,
    });
  }, { isolationLevel: "Serializable" });

  revalidatePath("/dashboard/caretaker/inspections");
  revalidatePath(
    `/dashboard/caretaker/inspections/${encodePublicId(
      inspectionId,
      "inspection",
    )}`,
  );
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/move-outs");
  revalidatePublicVacancies();

  revalidatePath(`/inspections/${encodePublicId(inspectionId, "inspection")}`);
  revalidatePath(`/dashboard/org/inspections/${encodePublicId(inspectionId, "inspection")}`);
  revalidatePath("/dashboard/org/inspections");
  revalidatePath("/dashboard/tenant/notices");
  revalidatePath("/dashboard/tenant/inspections");
}
