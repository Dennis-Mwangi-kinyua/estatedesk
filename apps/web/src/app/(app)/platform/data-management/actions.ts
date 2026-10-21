"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { writeAuditLog } from "@/lib/audit/security";
import { sendApprovedDataExportEmail } from "@/lib/data-export/send-approved-data-export-email";

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
      deliveryMethod: true,
      deliveryEmail: true,
      org: { select: { name: true } },
    },
  });

  let emailSentAt: Date | null = null;
  let emailDeliveryError: string | null = null;
  if (exportRequest.deliveryMethod === "EMAIL" && exportRequest.deliveryEmail) {
    try {
      await sendApprovedDataExportEmail({ orgId: exportRequest.orgId, orgName: exportRequest.org.name, to: exportRequest.deliveryEmail });
      emailSentAt = new Date();
    } catch (error) {
      emailDeliveryError = error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed.";
      console.error("[data-export-delivery] Approved export email failed", { requestId: exportRequest.id });
    }
    await prisma.dataExportRequest.update({
      where: { id: exportRequest.id },
      data: { emailSentAt, emailDeliveryError },
    });
  }

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
      deliveryMethod: exportRequest.deliveryMethod,
      emailDeliverySucceeded: exportRequest.deliveryMethod !== "EMAIL" || emailSentAt !== null,
    },
  });

  revalidatePath(DATA_MANAGEMENT_PATH);
  revalidatePath("/dashboard/org/settings");
}

export async function retryDataExportEmailAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const requestId = readString(formData, "requestId");
  if (!requestId) throw new Error("Missing export request id.");

  const exportRequest = await prisma.dataExportRequest.findFirst({
    where: { id: requestId, status: "APPROVED", deliveryMethod: "EMAIL", emailSentAt: null },
    select: { id: true, orgId: true, deliveryEmail: true, org: { select: { name: true } } },
  });
  if (!exportRequest?.deliveryEmail) throw new Error("This approved request has no pending email delivery.");

  try {
    await sendApprovedDataExportEmail({ orgId: exportRequest.orgId, orgName: exportRequest.org.name, to: exportRequest.deliveryEmail });
    await prisma.dataExportRequest.update({ where: { id: exportRequest.id }, data: { emailSentAt: new Date(), emailDeliveryError: null } });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed.";
    await prisma.dataExportRequest.update({ where: { id: exportRequest.id }, data: { emailDeliveryError: message } });
    throw new Error("Email delivery failed. The approved archive is still available to download.");
  }

  await writeAuditLog({
    orgId: exportRequest.orgId,
    actorUserId: session.userId,
    action: "DATA_EXPORT_EMAIL_RETRIED",
    entityType: "DataExportRequest",
    entityId: exportRequest.id,
    metadata: { deliveryMethod: "EMAIL" },
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
