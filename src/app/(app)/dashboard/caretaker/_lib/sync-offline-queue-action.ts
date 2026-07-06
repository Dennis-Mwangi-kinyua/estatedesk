"use server";

import { revalidatePath } from "next/cache";
import { safeServerActionError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { getCaretakerManagedBuildingUnitIds } from "@/lib/caretaker/access";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { saveImagePayloadAsset } from "@/lib/uploads/image-payload";
import type {
  OfflineIssueItem,
  OfflineMeterReadingItem,
  OfflineQueueItem,
} from "./offline-queue";

type SyncResult = {
  ok: boolean;
  syncedIds: string[];
  errors: Array<{ id: string; message: string }>;
};

export async function syncOfflineQueueAction(
  items: OfflineQueueItem[],
): Promise<SyncResult> {
  const session = await requireCaretakerAccess();
  const orgId = session.activeOrgId!;
  const syncedIds: string[] = [];
  const errors: Array<{ id: string; message: string }> = [];

  const allowedUnitIds = await getCaretakerManagedBuildingUnitIds({
    orgId,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  for (const item of items) {
    try {
      if (item.kind === "meter_reading") {
        await syncMeterReadingItem({
          item,
          allowedUnitIds,
          orgId,
          submittedByUserId: session.userId,
        });
      } else {
        await syncIssueItem({
          item,
          orgId,
          userId: session.userId,
          allowedUnitIds,
        });
      }

      syncedIds.push(item.id);
    } catch (error) {
      errors.push({
        id: item.id,
        message: safeServerActionError(
          "syncOfflineQueueAction",
          error,
          "Could not sync this item.",
        ),
      });
    }
  }

  revalidatePath("/dashboard/caretaker/water-bills");
  revalidatePath("/dashboard/caretaker/issues");
  revalidatePath("/dashboard/caretaker/today");

  return {
    ok: errors.length === 0,
    syncedIds,
    errors,
  };
}

async function syncMeterReadingItem({
  item,
  allowedUnitIds,
  orgId,
  submittedByUserId,
}: {
  item: OfflineMeterReadingItem;
  allowedUnitIds: string[];
  orgId: string;
  submittedByUserId: string;
}) {
  if (!allowedUnitIds.includes(item.unitId)) {
    throw new Error("Unit is outside your assignment scope.");
  }

  const existing = await prisma.meterReading.findUnique({
    where: {
      unitId_period: {
        unitId: item.unitId,
        period: item.period,
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A reading already exists for this unit and period.");
  }

  const unitsUsed = item.currentReading - item.prevReading;
  let photoAssetId: string | undefined;

  if (item.photoPayload) {
    photoAssetId = await saveImagePayloadAsset({
      payload: item.photoPayload,
      uploadDir: "meters",
      filePrefix: `${item.unitId}-${item.period}`,
      orgId,
      unitId: item.unitId,
      submittedByUserId,
      purpose: "meter_reading_evidence",
      metadata: {
        period: item.period,
      },
    });
  }

  await prisma.meterReading.create({
    data: {
      unitId: item.unitId,
      period: item.period,
      prevReading: item.prevReading,
      currentReading: item.currentReading,
      unitsUsed,
      submittedByUserId,
      notes: item.notes ?? null,
      photoAssetId,
    },
  });
}

async function syncIssueItem({
  item,
  orgId,
  userId,
  allowedUnitIds,
}: {
  item: OfflineIssueItem;
  orgId: string;
  userId: string;
  allowedUnitIds: string[];
}) {
  let propertyId = item.propertyId;
  let unitId = item.unitId;

  if (unitId && !allowedUnitIds.includes(unitId)) {
    throw new Error("Unit is outside your assignment scope.");
  }

  if (unitId && !propertyId) {
    const unit = await prisma.unit.findFirst({
      where: { id: unitId, deletedAt: null },
      select: { propertyId: true },
    });
    propertyId = unit?.propertyId;
  }

  let photoAssetId: string | undefined;

  if (item.photoPayload) {
    photoAssetId = await saveImagePayloadAsset({
      payload: item.photoPayload,
      uploadDir: "issues",
      filePrefix: unitId ?? "general",
      orgId,
      unitId,
      submittedByUserId: userId,
      purpose: "issue_evidence",
    });
  }

  await prisma.issueTicket.create({
    data: {
      orgId,
      reportedByUserId: userId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      propertyId,
      unitId,
      photoAssetId,
      status: "OPEN",
    },
  });
}