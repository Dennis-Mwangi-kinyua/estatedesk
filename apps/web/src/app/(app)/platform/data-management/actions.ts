"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { writeAuditLog } from "@/lib/audit/security";

const DATA_MANAGEMENT_PATH = "/platform/data-management";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function approveDataExportRequestAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const requestId = readString(formData, "requestId");
  const reviewerNotes = readString(formData, "reviewerNotes") || null;

  if (!requestId) {
    throw new Error("Missing export request id.");
  }

  const now = new Date();
  const expiresAt = addDays(now, 7);

  const exportRequest = await prisma.dataExportRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewerNotes,
      reviewedByUserId: session.userId,
      reviewedAt: now,
      expiresAt,
    },
    select: {
      id: true,
      orgId: true,
      requestedByUserId: true,
      status: true,
      expiresAt: true,
    },
  });

  await writeAuditLog({
    orgId: exportRequest.orgId,
    actorUserId: session.userId,
    action: "DATA_EXPORT_APPROVED",
    entityType: "DataExportRequest",
    entityId: exportRequest.id,
    metadata: {
      requestedByUserId: exportRequest.requestedByUserId,
      expiresAt: exportRequest.expiresAt?.toISOString() ?? null,
      reviewerNotesProvided: Boolean(reviewerNotes),
    },
  });

  revalidatePath(DATA_MANAGEMENT_PATH);
  revalidatePath("/dashboard/org/settings");
}

export async function rejectDataExportRequestAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const requestId = readString(formData, "requestId");
  const reviewerNotes = readString(formData, "reviewerNotes") || null;

  if (!requestId) {
    throw new Error("Missing export request id.");
  }

  const exportRequest = await prisma.dataExportRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewerNotes,
      reviewedByUserId: session.userId,
      reviewedAt: new Date(),
      expiresAt: null,
    },
    select: {
      id: true,
      orgId: true,
      requestedByUserId: true,
    },
  });

  await writeAuditLog({
    orgId: exportRequest.orgId,
    actorUserId: session.userId,
    action: "DATA_EXPORT_REJECTED",
    entityType: "DataExportRequest",
    entityId: exportRequest.id,
    metadata: {
      requestedByUserId: exportRequest.requestedByUserId,
      reviewerNotesProvided: Boolean(reviewerNotes),
    },
  });

  revalidatePath(DATA_MANAGEMENT_PATH);
  revalidatePath("/dashboard/org/settings");
}
