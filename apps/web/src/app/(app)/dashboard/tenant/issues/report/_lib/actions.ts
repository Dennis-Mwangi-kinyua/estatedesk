"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { TicketPriority } from "@prisma/client";

export async function reportIssueAction(formData: FormData) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unitId = String(formData.get("unitId") ?? "").trim();
  const priorityInput = String(formData.get("priority") ?? "MEDIUM").trim();

  const allowedPriorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const priority: TicketPriority = allowedPriorities.includes(
    priorityInput as TicketPriority,
  )
    ? (priorityInput as TicketPriority)
    : "MEDIUM";

  if (!title || !description || !unitId) {
    redirect("/dashboard/tenant/issues/report?error=missing_fields");
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
        },
        include: {
          unit: true,
        },
      },
    },
  });

  if (!tenant) {
    redirect("/dashboard/tenant/issues/report?error=tenant_not_found");
  }

  const allowedUnit = tenant.leases.find((lease) => lease.unitId === unitId)?.unit;

  if (!allowedUnit) {
    redirect("/dashboard/tenant/issues/report?error=invalid_unit");
  }

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

  const unitDetails = await prisma.unit.findUnique({
    where: {
      id: allowedUnit.id,
    },
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
  });

  const unitText = [
    unitDetails?.property.name,
    unitDetails?.building?.name,
    unitDetails?.houseNo ? `Unit ${unitDetails.houseNo}` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  await prisma.$transaction(async (tx) => {
    const issue = await tx.issueTicket.create({
      data: {
        orgId: session.activeOrgId!,
        propertyId: allowedUnit.propertyId,
        unitId: allowedUnit.id,
        reportedByUserId: session.userId,
        title,
        description,
        priority,
        status: "OPEN",
      },
      select: {
        id: true,
      },
    });

    await notifyInAppAndPush({
      db: tx,
      orgId: session.activeOrgId!,
      recipients: [{ tenantId: tenant.id, userId: session.userId }],
      type: "ISSUE_CREATED",
      title: "Issue submitted",
      message: `Your issue "${title}" for ${unitText || "your unit"} has been submitted.`,
    });

    if (orgReviewers.length > 0) {
      await notifyInAppAndPush({
        db: tx,
        orgId: session.activeOrgId!,
        recipients: orgReviewers.map(({ userId }) => ({
          tenantId: tenant.id,
          userId,
        })),
        type: "ISSUE_CREATED",
        title: "New tenant issue",
        message: `${tenant.fullName} reported "${title}" for ${unitText || "a unit"}. Priority: ${priority}.`,
      });
    }

    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "ISSUE_CREATED",
        entityType: "IssueTicket",
        entityId: issue.id,
        metadata: {
          priority,
          unitId: allowedUnit.id,
          tenantId: tenant.id,
        },
      },
    });
  });

  revalidatePath("/dashboard/tenant/issues");
  revalidatePath("/dashboard/org/issues");
  revalidatePath("/dashboard/org/notifications");
  redirect("/dashboard/tenant/issues");
}