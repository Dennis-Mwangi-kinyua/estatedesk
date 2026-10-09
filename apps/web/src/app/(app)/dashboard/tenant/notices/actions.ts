"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { parseMoveOutDate, nairobiDate } from "@/lib/move-outs/validation";
import { formatDate } from "@/lib/formatters";
import { createEstateDeskReference } from "@/lib/estatedesk-reference";

export async function submitMoveOutNotice(formData: FormData) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const moveOutDateRaw = String(formData.get("moveOutDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!moveOutDateRaw) {
    redirect("/dashboard/tenant/notices?error=missing_move_out_date");
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    include: {
      leases: {
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        orderBy: {
          startDate: "desc",
        },
        take: 1,
      },
    },
  });

  const activeLease = tenant?.leases[0];

  if (!tenant || !activeLease) {
    redirect("/dashboard/tenant/notices?error=no_active_lease");
  }

  let moveOutDate: Date;
  try { moveOutDate = parseMoveOutDate(moveOutDateRaw); } catch { redirect("/dashboard/tenant/notices?error=invalid_move_out_date"); }
  if (moveOutDateRaw < nairobiDate() || moveOutDate < activeLease.startDate || notes.length > 1000) redirect("/dashboard/tenant/notices?error=invalid_move_out_date");

  const existingNotice = await prisma.moveOutNotice.findFirst({
    where: {
      leaseId: activeLease.id,
      tenantId: tenant.id,
      status: {
        in: ["SUBMITTED", "INSPECTION_SCHEDULED", "INSPECTION_COMPLETED"],
      },
    },
  });

  if (existingNotice) {
    redirect("/dashboard/tenant/notices?error=duplicate_open_notice");
  }

  const leaseDetails = await prisma.lease.findUnique({
    where: {
      id: activeLease.id,
    },
    select: {
      unit: {
        select: {
          houseNo: true,
          property: {
            select: {
              name: true,
            },
          },
          building: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const orgReviewers = await prisma.membership.findMany({
    where: {
      orgId: session.activeOrgId,
      employmentEndedAt: null,
      deactivatedAt: null,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE"],
      },
      user: {
        deletedAt: null,
        status: "ACTIVE",
      },
    },
    select: {
      userId: true,
    },
  });

  const unitLabel = [
    leaseDetails?.unit.property.name,
    leaseDetails?.unit.building?.name,
    leaseDetails?.unit.houseNo ? `Unit ${leaseDetails.unit.houseNo}` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  await prisma.$transaction(async (tx) => {
    const open = await tx.moveOutNotice.findFirst({ where: { leaseId: activeLease.id, status: { in: ["SUBMITTED", "INSPECTION_SCHEDULED", "INSPECTION_COMPLETED"] } }, select: { id: true } });
    if (open) redirect("/dashboard/tenant/notices?error=duplicate_open_notice");
    const notice = await tx.moveOutNotice.create({
      data: {
        referenceCode: createEstateDeskReference(),
        leaseId: activeLease.id,
        tenantId: tenant.id,
        moveOutDate,
        notes: notes || null,
      },
    });

    await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, action: "MOVE_OUT_NOTICE_SUBMITTED", entityType: "MoveOutNotice", entityId: notice.id, metadata: { moveOutDate: moveOutDate.toISOString() } } });
    await notifyInAppAndPush({ actorUserId: session.userId,
      db: tx,
      orgId: session.activeOrgId!,
      recipients: [{ tenantId: tenant.id, userId: tenant.userId }],
      type: "GENERAL",
      title: "Move-out notice submitted",
      message: `Your move-out notice for ${unitLabel || "your unit"} has been submitted for ${formatDate(moveOutDate)}.`,
    });

    if (orgReviewers.length > 0) {
      await notifyInAppAndPush({ actorUserId: session.userId,
        db: tx,
        orgId: session.activeOrgId!,
        recipients: orgReviewers.map(({ userId }) => ({ userId })),
        type: "GENERAL",
        title: "New move-out notice",
        message: `${tenant.fullName} submitted a move-out notice for ${unitLabel || "their unit"} on ${formatDate(moveOutDate)}.`,
      });
    }
  }, { isolationLevel: "Serializable" });

  revalidatePath("/dashboard/tenant/notices");
  revalidatePath("/dashboard/tenant/inspections");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/move-outs");
  redirect("/dashboard/tenant/notices?success=notice_submitted");
}

export async function withdrawMoveOutNotice(formData: FormData) {
  const session = await requireTenantAccess();
  const noticeId = String(formData.get("noticeId") ?? "").trim();
  if (!noticeId || !session.activeOrgId) return { ok: false as const, error: "We could not find an active move-out notice to cancel." };
  const withdrawn = await prisma.$transaction(async tx => {
    const notice = await tx.moveOutNotice.findFirst({ where: { id: noticeId, tenant: { userId: session.userId, orgId: session.activeOrgId!, deletedAt: null }, lease: { status: "ACTIVE", deletedAt: null }, status: { in: ["SUBMITTED", "INSPECTION_SCHEDULED"] } }, include: { inspection: true } });
    if (!notice) return false;
    const changed = await tx.moveOutNotice.updateMany({ where: { id: notice.id, status: notice.status }, data: { status: "CANCELLED" } });
    if (changed.count !== 1) throw new Error("This notice has changed. Refresh and try again.");
    await tx.inspection.updateMany({ where: { noticeId: notice.id, status: "SCHEDULED" }, data: { status: "CANCELLED" } });
    const reviewers = await tx.membership.findMany({ where: { orgId: session.activeOrgId!, role: { in: ["ADMIN", "MANAGER", "OFFICE"] }, employmentEndedAt: null, deactivatedAt: null }, select: { userId: true } });
    await notifyInAppAndPush({ actorUserId: session.userId, db: tx, orgId: session.activeOrgId!, recipients: [...reviewers.map(item => ({ userId: item.userId })), ...(notice.inspection ? [{ userId: notice.inspection.inspectorUserId }] : [])], type: "GENERAL", title: "Move-out notice withdrawn", message: "The tenant withdrew their move-out notice. Any scheduled inspection is cancelled and the lease remains active." });
    await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, action: "MOVE_OUT_NOTICE_WITHDRAWN", entityType: "MoveOutNotice", entityId: notice.id } });
    return true;
  }, { isolationLevel: "Serializable" });
  if (!withdrawn) return { ok: false as const, error: "This notice can no longer be cancelled. Only notices awaiting inspection can be cancelled." };
  for (const path of ["/dashboard/tenant/notices", "/dashboard/tenant/inspections", "/dashboard/org/move-outs", "/dashboard/org/notifications", "/dashboard/org/inspections", "/dashboard/caretaker/inspections"]) revalidatePath(path);
  return { ok: true as const };
}
