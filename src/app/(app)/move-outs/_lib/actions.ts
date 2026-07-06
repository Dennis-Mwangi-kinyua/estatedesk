"use server";

import { revalidatePath } from "next/cache";
import { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { recordVacatedTenancy } from "@/lib/tenants/identity";
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

  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Inspection date is invalid.");
  }

  await prisma.$transaction(async (tx) => {
    const notice = await tx.moveOutNotice.findFirst({
      where: {
        id: noticeId,
        status: "SUBMITTED",
        lease: {
          orgId: session.activeOrgId!,
        },
      },
      select: {
        id: true,
        inspection: {
          select: { id: true },
        },
      },
    });

    if (!notice || notice.inspection) {
      throw new Error("This move-out notice cannot be scheduled.");
    }

    const inspector = await tx.membership.findFirst({
      where: {
        orgId: session.activeOrgId!,
        userId: inspectorUserId,
        role: {
          in: [OrgRole.CARETAKER, OrgRole.MANAGER, OrgRole.OFFICE, OrgRole.ADMIN],
        },
        user: {
          deletedAt: null,
        },
      },
      select: { userId: true },
    });

    if (!inspector) {
      throw new Error("Selected inspector is not available in this organisation.");
    }

    await tx.inspection.create({
      data: {
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
  });

  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/move-outs");
  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/inspections");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/caretaker/inspections");
  revalidatePath("/dashboard/tenant/inspections");
}

export async function closeMoveOutAction(formData: FormData) {
  "use server";

  const session = await requireManagementAccess();
  const noticeId = String(formData.get("noticeId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!noticeId) {
    throw new Error("Move-out notice is required.");
  }

  await prisma.$transaction(async (tx) => {
    const notice = await tx.moveOutNotice.findFirst({
      where: {
        id: noticeId,
        status: "INSPECTION_COMPLETED",
        lease: {
          orgId: session.activeOrgId!,
        },
      },
      select: {
        id: true,
        tenantId: true,
        leaseId: true,
        tenant: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!notice) {
      throw new Error("Only inspection-completed move-outs can be closed.");
    }

    await tx.moveOutNotice.update({
      where: { id: notice.id },
      data: {
        status: "CLOSED",
        notes: notes || undefined,
      },
    });

    await recordVacatedTenancy(tx, {
      tenantId: notice.tenantId,
      leaseId: notice.leaseId,
      moveOutNoticeId: notice.id,
      actorUserId: session.userId,
      notes: notes || "Move-out confirmed by organization.",
    });

    await tx.tenantHistoryRecord.updateMany({
      where: {
        tenantId: notice.tenantId,
        leaseId: notice.leaseId,
        moveOutNoticeId: notice.id,
      },
      data: {
        status: "ARCHIVED",
        notes: notes || undefined,
      },
    });

    await notifyInAppAndPush({ db: tx, orgId: session.activeOrgId!, recipients: [{ tenantId: notice.tenantId }], type: "MOVE_OUT_CLOSED", title: "Move-out closed", message: `Move-out closeout for ${notice.tenant.fullName} has been completed.${notes ? ` Notes: ${notes}` : ""}` });

    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "MOVE_OUT_CLOSED",
        entityType: "MoveOutNotice",
        entityId: notice.id,
        metadata: {
          notes,
        },
      },
    });
  });

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

