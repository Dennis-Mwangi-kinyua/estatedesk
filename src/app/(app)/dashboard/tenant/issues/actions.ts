"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";

const TENANT_ISSUES_PATH = "/dashboard/tenant/issues";

export async function confirmIssueResolutionAction(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const issueId = String(formData.get("issueId") ?? "");
  const tenantFeedback = String(formData.get("tenantFeedback") ?? "").trim();

  if (!reportId || !issueId) {
    redirect(TENANT_ISSUES_PATH);
  }

  const session = await requireTenantAccess();

  if (!session.activeOrgId) {
    redirect(TENANT_ISSUES_PATH);
  }

  const report = await prisma.issueResolutionReport.findFirst({
    where: {
      id: reportId,
      issueId,
      orgId: session.activeOrgId,
      status: "OFFICE_APPROVED",
      issue: {
        reportedByUserId: session.userId,
      },
    },
    include: {
      issue: {
        select: {
          id: true,
          title: true,
          orgId: true,
          assignedToUserId: true,
        },
      },
    },
  });

  if (!report) {
    redirect(TENANT_ISSUES_PATH);
  }

  const officeMemberships = await prisma.membership.findMany({
    where: {
      orgId: report.issue.orgId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE"],
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      userId: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.issueResolutionReport.update({
      where: {
        id: report.id,
      },
      data: {
        status: "TENANT_CONFIRMED",
        tenantConfirmedByUserId: session.userId,
        tenantConfirmedAt: new Date(),
        tenantFeedback: tenantFeedback || null,
      },
    });

    await tx.issueTicket.update({
      where: {
        id: report.issue.id,
      },
      data: {
        status: "CLOSED",
        resolvedAt: new Date(),
      },
    });

    await Promise.all(
      officeMemberships.map((membership) =>
        tx.notification.create({
          data: {
            orgId: report.issue.orgId,
            userId: membership.userId,
            channel: "IN_APP",
            type: "ISSUE_RESOLVED",
            title: "Tenant confirmed issue closure",
            message: `The tenant confirmed the completion report for "${report.issue.title}". The ticket is now closed.`,
            status: "QUEUED",
          },
        }),
      ),
    );

    if (report.issue.assignedToUserId) {
      await tx.notification.create({
        data: {
          orgId: report.issue.orgId,
          userId: report.issue.assignedToUserId,
          channel: "IN_APP",
          type: "ISSUE_RESOLVED",
          title: "Issue confirmed and closed",
          message: `The tenant confirmed your work for "${report.issue.title}".`,
          status: "QUEUED",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        orgId: report.issue.orgId,
        actorUserId: session.userId,
        action: "ISSUE_RESOLUTION_TENANT_CONFIRMED",
        entityType: "IssueResolutionReport",
        entityId: report.id,
        metadata: {
          issueId: report.issue.id,
        },
      },
    });
  });

  revalidatePath(TENANT_ISSUES_PATH);
  revalidatePath("/dashboard/org/issues");
  revalidatePath("/dashboard/caretaker/issues");
  revalidatePath("/dashboard/org/notifications");
  redirect(TENANT_ISSUES_PATH);
}
