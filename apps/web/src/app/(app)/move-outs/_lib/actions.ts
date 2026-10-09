"use server";

import { saveRefundProof } from "@/lib/move-outs/refund-proof";
import { recordMoveOutRefund } from "@/lib/move-outs/refund";
import { canInspectUnit } from "@/lib/move-outs/inspection-scope";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { closeMoveOut } from "@/lib/move-outs/closeout";
import { encodePublicId } from "@/lib/public-id";
import { parseInspectionDate } from "@/lib/move-outs/validation";
import { notifyInAppAndPush } from "@/lib/notifications/notify";

export async function scheduleInspectionAction(formData: FormData) {
  "use server";

  const session = await requireManagementAccess();
  const noticeId = String(formData.get("noticeId") ?? "").trim();
  const inspectorUserId = String(formData.get("inspectorUserId") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();

  if (!noticeId || !inspectorUserId || !scheduledAtRaw) {
    throw new Error("Notice, inspector, and scheduled time are required.");
  }

  const scheduledAt = parseInspectionDate(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Inspection date is invalid.");
  }

  await prisma.$transaction(async (tx) => {
    const notice = await tx.moveOutNotice.findFirst({
      where: {
        id: noticeId,
        status: { in: ["SUBMITTED", "INSPECTION_SCHEDULED"] },
        lease: {
          orgId: session.activeOrgId!,
        },
      },
      select: {
        id: true,
        tenantId: true,
        lease: { select: { unit: { select: { id: true, propertyId: true, buildingId: true } } } },
        inspection: {
          select: { id: true, status: true },
        },
      },
    });

    if (!notice || (notice.inspection && notice.inspection.status !== "SCHEDULED")) {
      throw new Error("This move-out notice cannot be scheduled.");
    }

    const inspector = await tx.membership.findMany({
      where: {
        orgId: session.activeOrgId!,
        employmentEndedAt: null,
        deactivatedAt: null,
        userId: inspectorUserId,
        role: { not: "TENANT" },
        user: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },
      select: { userId: true, role: true, scopeType: true, scopeId: true },
    });

    if (!canInspectUnit(inspector, notice.lease.unit)) {
      throw new Error("Selected inspector is not available in this organisation.");
    }

    const inspection = await tx.inspection.upsert({
      where: { noticeId: notice.id },
      update: { inspectorUserId, scheduledAt },
      create: {
        noticeId: notice.id,
        inspectorUserId,
        scheduledAt,
        status: "SCHEDULED",
      },
    });

    await tx.moveOutNotice.update({
      where: { id: notice.id },
      data: { status: "INSPECTION_SCHEDULED" },
    });

    await notifyInAppAndPush({ actorUserId: session.userId, db: tx, orgId: session.activeOrgId!, recipients: [{ userId: inspectorUserId }], actionUrl: `/inspections/${encodePublicId(inspection.id, "inspection")}`, type: "GENERAL", title: "Move-out inspection scheduled", message: `Your inspection is scheduled for ${scheduledAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} (Nairobi time). Report: /inspections/${encodePublicId(inspection.id, "inspection")}` });

    await notifyInAppAndPush({ actorUserId: session.userId, db: tx, orgId: session.activeOrgId!, recipients: [{ tenantId: notice.tenantId }], type: "GENERAL", title: "Move-out inspection scheduled", message: `Your inspection is scheduled for ${scheduledAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} (Nairobi time).`, actionUrl: "/dashboard/tenant/notices" });

    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "INSPECTION_SCHEDULED",
        entityType: "MoveOutNotice",
        entityId: notice.id,
        metadata: {
          inspectorUserId,
          scheduledAt: scheduledAt.toISOString(),
        },
      },
    });
  }, { isolationLevel: "Serializable" });

  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/move-outs");
  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/inspections");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/caretaker/inspections");
  revalidatePath("/dashboard/tenant/inspections");
  revalidatePath("/dashboard/tenant/notices");
}

export async function closeMoveOutAction(formData: FormData) {
  "use server";

  const session = await requireManagementAccess();
  const noticeId = String(formData.get("noticeId") ?? "").trim();

  if (!noticeId) {
    throw new Error("Move-out notice is required.");
  }

  await prisma.$transaction((tx) => closeMoveOut(tx, { noticeId, orgId: session.activeOrgId!, actorUserId: session.userId, form: formData }), { isolationLevel: "Serializable" });

  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/move-outs");
  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/org/verify-tenant");
  revalidatePath("/dashboard/org/units");
  revalidatePath("/dashboard/org/properties");
  revalidatePath("/dashboard/org/tenants");
  revalidatePath("/dashboard/tenant");
  revalidatePublicVacancies();
}



export async function recordMoveOutRefundAction(form: FormData) {
  const session = await requireManagementAccess();
  const noticeId = String(form.get("noticeId") ?? "").trim();
  const reference = String(form.get("refundReference") ?? "").trim();
  if (!reference || reference.length > 200 || form.get("refundPaid") !== "on") throw new Error("Confirm payment and enter a refund reference (up to 200 characters).");
  const eligible = await prisma.moveOutNotice.findFirst({ where: { id: noticeId, status: "CLOSED", lease: { orgId: session.activeOrgId! } }, include: { lease: true } });
  if (!eligible) throw new Error("Move-out not found.");
  const proof = form.get("proof");
  if (!(proof instanceof File) || proof.size <= 0 || proof.size > 2 * 1024 * 1024) throw new Error("Attach refund payment proof (image, up to 2MB).");
  const method = String(form.get("refundMethod") ?? "");
  if (!["CASH", "BANK", "MPESA"].includes(method)) throw new Error("Select the refund payment method.");
  const proofAssetId = await saveRefundProof(proof, { noticeId, orgId: session.activeOrgId!, unitId: eligible.lease.unitId, actorUserId: session.userId });
  await prisma.$transaction(tx => recordMoveOutRefund(tx, { noticeId, orgId: session.activeOrgId!, actorUserId: session.userId, reference, method, proofAssetId }), { isolationLevel: "Serializable" });
  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/move-outs");
  revalidatePath("/dashboard/tenant/notices");
}

export async function releaseMoveOutUnitAction(form: FormData) {
  const session = await requireManagementAccess();
  if (form.get("readyConfirmed") !== "on") throw new Error("Confirm repairs and cleaning are complete.");
  await prisma.$transaction(async tx => {
    const notice = await tx.moveOutNotice.findFirst({ where: { id: String(form.get("noticeId") ?? ""), status: "CLOSED", lease: { orgId: session.activeOrgId! } }, include: { lease: true } });
    if (!notice) throw new Error("Closed move-out not found.");
    if (await tx.lease.findFirst({ where: { unitId: notice.lease.unitId, status: { in: ["ACTIVE", "PENDING"] }, deletedAt: null } })) throw new Error("Unit has another active or pending lease.");
    const changed = await tx.unit.updateMany({ where: { id: notice.lease.unitId, status: "UNDER_MAINTENANCE" }, data: { status: "VACANT" } });
    if (changed.count !== 1) throw new Error("Unit is no longer awaiting maintenance.");
    await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, action: "MOVE_OUT_UNIT_READY", entityType: "Unit", entityId: notice.lease.unitId, metadata: { noticeId: notice.id } } });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/move-outs");
  revalidatePath("/dashboard/org/units");
  revalidatePublicVacancies();
}
