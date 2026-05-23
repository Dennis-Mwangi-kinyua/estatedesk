"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

const CARETAKER_ISSUES_PATH = "/dashboard/caretaker/issues";

export async function submitIssueResolutionReportAction(formData: FormData) {
  const issueId = String(formData.get("issueId") ?? "");
  const workSummary = String(formData.get("workSummary") ?? "").trim();
  const materialsUsed = String(formData.get("materialsUsed") ?? "").trim();
  const tenantInstructions = String(
    formData.get("tenantInstructions") ?? "",
  ).trim();

  if (!issueId || workSummary.length < 10) {
    redirect(CARETAKER_ISSUES_PATH);
  }

  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect(CARETAKER_ISSUES_PATH);
  }

  const issue = await prisma.issueTicket.findFirst({
    where: {
      id: issueId,
      orgId: session.activeOrgId,
      assignedToUserId: session.userId,
      status: "IN_PROGRESS",
    },
    select: {
      id: true,
      title: true,
      orgId: true,
      reportedByUserId: true,
      resolutionReports: {
        where: {
          status: {
            in: ["SUBMITTED", "OFFICE_APPROVED"],
          },
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!issue || issue.resolutionReports.length > 0) {
    redirect(CARETAKER_ISSUES_PATH);
  }

  const officeMemberships = await prisma.membership.findMany({
    where: {
      orgId: issue.orgId,
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
    const report = await tx.issueResolutionReport.create({
      data: {
        issueId: issue.id,
        orgId: issue.orgId,
        caretakerUserId: session.userId,
        workSummary,
        materialsUsed: materialsUsed || null,
        tenantInstructions: tenantInstructions || null,
      },
    });

    await Promise.all(
      officeMemberships.map((membership) =>
        tx.notification.create({
          data: {
            orgId: issue.orgId,
            userId: membership.userId,
            channel: "IN_APP",
            type: "GENERAL",
            title: "Issue completion report submitted",
            message: `A caretaker submitted a completion report for "${issue.title}". Review it before sending to the tenant for confirmation.`,
            status: "QUEUED",
          },
        }),
      ),
    );

    await tx.auditLog.create({
      data: {
        orgId: issue.orgId,
        actorUserId: session.userId,
        action: "ISSUE_RESOLUTION_REPORT_SUBMITTED",
        entityType: "IssueResolutionReport",
        entityId: report.id,
        metadata: {
          issueId: issue.id,
        },
      },
    });
  });

  revalidatePath(CARETAKER_ISSUES_PATH);
  revalidatePath("/dashboard/org/issues");
  revalidatePath("/dashboard/org/notifications");
  redirect(CARETAKER_ISSUES_PATH);
}
