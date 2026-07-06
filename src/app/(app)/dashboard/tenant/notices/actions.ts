"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { formatDate } from "@/lib/formatters";

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

  const moveOutDate = new Date(moveOutDateRaw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(moveOutDate.getTime()) || moveOutDate < today) {
    redirect("/dashboard/tenant/notices?error=invalid_move_out_date");
  }

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
    await tx.moveOutNotice.create({
      data: {
        leaseId: activeLease.id,
        tenantId: tenant.id,
        moveOutDate,
        notes: notes || null,
      },
    });

    await notifyInAppAndPush({
      db: tx,
      orgId: session.activeOrgId!,
      recipients: [{ tenantId: tenant.id, userId: tenant.userId }],
      type: "GENERAL",
      title: "Move-out notice submitted",
      message: `Your move-out notice for ${unitLabel || "your unit"} has been submitted for ${formatDate(moveOutDate)}.`,
    });

    if (orgReviewers.length > 0) {
      await notifyInAppAndPush({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: orgReviewers.map(({ userId }) => ({
          userId,
          tenantId: tenant.id,
        })),
        type: "GENERAL",
        title: "New move-out notice",
        message: `${tenant.fullName} submitted a move-out notice for ${unitLabel || "their unit"} on ${formatDate(moveOutDate)}.`,
      });
    }
  });

  revalidatePath("/dashboard/tenant/notices");
  revalidatePath("/dashboard/tenant/inspections");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/move-outs");
  redirect("/dashboard/tenant/notices?success=notice_submitted");
}