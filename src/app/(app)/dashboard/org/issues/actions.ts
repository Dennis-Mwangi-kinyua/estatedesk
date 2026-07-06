"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { encodePublicId } from "@/lib/public-id";
import { notifyInAppAndPush, notifyRecipients } from "@/lib/notifications/notify";
import { getCurrentOrgContext } from "./_lib/queries";
import {
  buildIssuesHref,
  canAssignCaretakerRole,
  normalizeIssueStatusFilter,
} from "./_lib/helpers";
import {
  ISSUE_PAGE_PATH,
  RESOLUTION_REPORTS_QUEUE_PATH,
} from "./_lib/types";

export async function assignCaretakerAction(formData: FormData) {
  const issueId = String(formData.get("issueId") ?? "");
  const caretakerUserId = String(formData.get("caretakerUserId") ?? "");
  const page = String(formData.get("page") ?? "1");
  const activeFilter = normalizeIssueStatusFilter(
    String(formData.get("filter") ?? "all"),
  );

  if (!issueId || !caretakerUserId) {
    redirect(ISSUE_PAGE_PATH);
  }

  const membership = await getCurrentOrgContext();
  const session = await requireUserSession();

  if (!canAssignCaretakerRole(membership.role)) {
    redirect(buildIssuesHref(Number(page) || 1, issueId, activeFilter));
  }

  const caretakerMembership = await prisma.membership.findFirst({
    where: {
      orgId: membership.orgId,
      userId: caretakerUserId,
      role: "CARETAKER",
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!caretakerMembership) {
    redirect(buildIssuesHref(Number(page) || 1, issueId, activeFilter));
  }

  const issue = await prisma.issueTicket.findFirst({
    where: {
      id: issueId,
      orgId: membership.orgId,
    },
    select: {
      id: true,
      title: true,
      priority: true,
      reportedByUserId: true,
      unit: {
        select: {
          houseNo: true,
          property: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!issue) {
    redirect(buildIssuesHref(Number(page) || 1, issueId, activeFilter));
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueTicket.update({
      where: {
        id: issue.id,
      },
      data: {
        assignedTo: {
          connect: {
            id: caretakerMembership.user.id,
          },
        },
        assignedBy: {
          connect: {
            id: session.userId,
          },
        },
        status: "IN_PROGRESS",
      },
    });

    const isUrgentAssignment =
      issue.priority === TicketPriority.URGENT ||
      issue.priority === TicketPriority.HIGH;
    const caretakerIssueUrl = `/dashboard/caretaker/issues/${encodePublicId(
      issue.id,
      "issue",
    )}`;
    const assignmentMessage = `You have been assigned "${issue.title}" for ${issue.unit?.property.name ?? "a property"}${issue.unit?.houseNo ? ` / Unit ${issue.unit.houseNo}` : ""}.`;

    if (isUrgentAssignment) {
      await notifyInAppAndPush({
        db: tx,
        orgId: membership.orgId,
        recipients: [{ userId: caretakerMembership.user.id }],
        type: "ISSUE_CREATED",
        title:
          issue.priority === TicketPriority.URGENT
            ? "Urgent issue assigned to you"
            : "High-priority issue assigned to you",
        message: assignmentMessage,
        actionUrl: caretakerIssueUrl,
      });
    } else {
      await notifyRecipients({
        db: tx,
        orgId: membership.orgId,
        recipients: [{ userId: caretakerMembership.user.id }],
        type: "ISSUE_CREATED",
        title: "Issue assigned to you",
        message: assignmentMessage,
        actionUrl: caretakerIssueUrl,
      });
    }

    await notifyRecipients({
      db: tx,
      orgId: membership.orgId,
      recipients: [{ userId: issue.reportedByUserId }],
      type: "GENERAL",
      title: "Issue assigned",
      message: `Your issue "${issue.title}" has been assigned to ${caretakerMembership.user.fullName ?? caretakerMembership.user.email ?? "a caretaker"}.`,
    });

    await tx.auditLog.create({
      data: {
        orgId: membership.orgId,
        actorUserId: session.userId,
        action: "ISSUE_ASSIGNED",
        entityType: "IssueTicket",
        entityId: issue.id,
        metadata: {
          caretakerUserId: caretakerMembership.user.id,
        },
      },
    });
  });

  revalidatePath(ISSUE_PAGE_PATH);
  revalidatePath("/dashboard/caretaker/issues");
  revalidatePath("/dashboard/org/notifications");
  redirect(buildIssuesHref(Number(page) || 1, issueId, activeFilter));
}

export async function updateIssueStatusAction(formData: FormData) {
  const issueId = String(formData.get("issueId") ?? "");
  const page = String(formData.get("page") ?? "1");
  const activeFilter = normalizeIssueStatusFilter(
    String(formData.get("filter") ?? "all"),
  );
  const nextStatus = String(formData.get("status") ?? "") as TicketStatus;
  const resolutionNotes = String(formData.get("resolutionNotes") ?? "").trim();

  if (!issueId || !nextStatus) {
    redirect(ISSUE_PAGE_PATH);
  }

  const membership = await getCurrentOrgContext();
  const session = await requireUserSession();

  const issue = await prisma.issueTicket.findFirst({
    where: {
      id: issueId,
      orgId: membership.orgId,
    },
    select: {
      id: true,
      title: true,
      resolvedAt: true,
      reportedByUserId: true,
      assignedToUserId: true,
    },
  });

  if (!issue) {
    redirect(buildIssuesHref(Number(page) || 1, issueId, activeFilter));
  }

  const data: {
    status: TicketStatus;
    resolvedAt?: Date | null;
    resolutionNotes?: string | null;
  } = {
    status: nextStatus,
  };

  if (nextStatus === "RESOLVED") {
    data.resolvedAt = new Date();
    if (resolutionNotes) {
      data.resolutionNotes = resolutionNotes;
    }
  } else if (nextStatus === "CLOSED") {
    data.resolvedAt = issue.resolvedAt ?? new Date();
  } else {
    data.resolvedAt = null;
    data.resolutionNotes = null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueTicket.update({
      where: {
        id: issue.id,
      },
      data,
    });

    await notifyInAppAndPush({ db: tx, orgId: membership.orgId, recipients: [{ userId: issue.reportedByUserId }], type: nextStatus === "RESOLVED" || nextStatus === "CLOSED" ? "ISSUE_RESOLVED" : "GENERAL", title: `Issue ${nextStatus.toLowerCase().replaceAll("_", " ")}`, message: `Your issue "${issue.title}" is now ${nextStatus.toLowerCase().replaceAll("_", " ")}.` });

    if (issue.assignedToUserId && issue.assignedToUserId !== issue.reportedByUserId) {
      await notifyInAppAndPush({ db: tx, orgId: membership.orgId, recipients: [{ userId: issue.assignedToUserId }], type: nextStatus === "RESOLVED" || nextStatus === "CLOSED" ? "ISSUE_RESOLVED" : "GENERAL", title: "Issue status updated", message: `"${issue.title}" is now ${nextStatus.toLowerCase().replaceAll("_", " ")}.` });
    }

    await tx.auditLog.create({
      data: {
        orgId: membership.orgId,
        actorUserId: session.userId,
        action: "ISSUE_STATUS_UPDATED",
        entityType: "IssueTicket",
        entityId: issue.id,
        metadata: {
          status: nextStatus,
        },
      },
    });
  });

  revalidatePath(ISSUE_PAGE_PATH);
  revalidatePath("/dashboard/tenant/issues");
  revalidatePath("/dashboard/caretaker/issues");
  revalidatePath("/dashboard/org/notifications");
  redirect(buildIssuesHref(Number(page) || 1, issueId, activeFilter));
}

function getResolutionReportRedirectTarget(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "");
  if (returnTo === "queue") {
    return RESOLUTION_REPORTS_QUEUE_PATH;
  }

  const page = String(formData.get("page") ?? "1");
  const issueId = String(formData.get("issueId") ?? "");
  const activeFilter = normalizeIssueStatusFilter(
    String(formData.get("filter") ?? "all"),
  );

  return buildIssuesHref(Number(page) || 1, issueId, activeFilter);
}

export async function approveIssueResolutionReportAction(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const issueId = String(formData.get("issueId") ?? "");
  const page = String(formData.get("page") ?? "1");
  const activeFilter = normalizeIssueStatusFilter(
    String(formData.get("filter") ?? "all"),
  );
  const officeNotes = String(formData.get("officeNotes") ?? "").trim();
  const redirectTarget = getResolutionReportRedirectTarget(formData);

  if (!reportId || !issueId) {
    redirect(
      redirectTarget === RESOLUTION_REPORTS_QUEUE_PATH
        ? RESOLUTION_REPORTS_QUEUE_PATH
        : ISSUE_PAGE_PATH,
    );
  }

  const membership = await getCurrentOrgContext();
  const session = await requireUserSession();

  if (!canAssignCaretakerRole(membership.role)) {
    redirect(redirectTarget);
  }

  const report = await prisma.issueResolutionReport.findFirst({
    where: {
      id: reportId,
      issueId,
      orgId: membership.orgId,
      status: "SUBMITTED",
    },
    include: {
      issue: {
        select: {
          id: true,
          title: true,
          reportedByUserId: true,
          assignedToUserId: true,
        },
      },
    },
  });

  if (!report) {
    redirect(redirectTarget);
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueResolutionReport.update({
      where: {
        id: report.id,
      },
      data: {
        status: "OFFICE_APPROVED",
        officeReviewedByUserId: session.userId,
        officeReviewedAt: new Date(),
        officeNotes: officeNotes || null,
      },
    });

    await tx.issueTicket.update({
      where: {
        id: report.issue.id,
      },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolutionNotes: report.workSummary,
      },
    });

    await notifyInAppAndPush({ db: tx, orgId: membership.orgId, recipients: [{ userId: report.issue.reportedByUserId }], type: "ISSUE_RESOLVED", title: "Confirm completed issue", message: `The office approved the caretaker report for "${report.issue.title}". Please confirm the work so the ticket can be closed.` });

    if (report.issue.assignedToUserId) {
      await notifyInAppAndPush({ db: tx, orgId: membership.orgId, recipients: [{ userId: report.issue.assignedToUserId }], type: "GENERAL", title: "Completion report approved", message: `The office approved your completion report for "${report.issue.title}".` });
    }

    await tx.auditLog.create({
      data: {
        orgId: membership.orgId,
        actorUserId: session.userId,
        action: "ISSUE_RESOLUTION_REPORT_APPROVED",
        entityType: "IssueResolutionReport",
        entityId: report.id,
        metadata: {
          issueId: report.issue.id,
        },
      },
    });
  });

  revalidatePath(ISSUE_PAGE_PATH);
  revalidatePath(RESOLUTION_REPORTS_QUEUE_PATH);
  revalidatePath("/dashboard/tenant/issues");
  revalidatePath("/dashboard/caretaker/issues");
  revalidatePath("/dashboard/org/notifications");
  redirect(redirectTarget);
}

export async function rejectIssueResolutionReportAction(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const issueId = String(formData.get("issueId") ?? "");
  const page = String(formData.get("page") ?? "1");
  const activeFilter = normalizeIssueStatusFilter(
    String(formData.get("filter") ?? "all"),
  );
  const officeNotes = String(formData.get("officeNotes") ?? "").trim();
  const redirectTarget = getResolutionReportRedirectTarget(formData);

  if (!reportId || !issueId) {
    redirect(
      redirectTarget === RESOLUTION_REPORTS_QUEUE_PATH
        ? RESOLUTION_REPORTS_QUEUE_PATH
        : ISSUE_PAGE_PATH,
    );
  }

  const membership = await getCurrentOrgContext();
  const session = await requireUserSession();

  if (!canAssignCaretakerRole(membership.role)) {
    redirect(redirectTarget);
  }

  const report = await prisma.issueResolutionReport.findFirst({
    where: {
      id: reportId,
      issueId,
      orgId: membership.orgId,
      status: "SUBMITTED",
    },
    include: {
      issue: {
        select: {
          id: true,
          title: true,
          assignedToUserId: true,
        },
      },
    },
  });

  if (!report) {
    redirect(redirectTarget);
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueResolutionReport.update({
      where: {
        id: report.id,
      },
      data: {
        status: "REJECTED",
        officeReviewedByUserId: session.userId,
        officeReviewedAt: new Date(),
        officeNotes: officeNotes || "Office requested more work before tenant confirmation.",
      },
    });

    await tx.issueTicket.update({
      where: {
        id: report.issue.id,
      },
      data: {
        status: "IN_PROGRESS",
        resolvedAt: null,
      },
    });

    if (report.issue.assignedToUserId) {
      await notifyInAppAndPush({ db: tx, orgId: membership.orgId, recipients: [{ userId: report.issue.assignedToUserId }], type: "GENERAL", title: "Completion report needs changes", message: `The office returned the completion report for "${report.issue.title}". Review the notes and submit again.` });
    }

    await tx.auditLog.create({
      data: {
        orgId: membership.orgId,
        actorUserId: session.userId,
        action: "ISSUE_RESOLUTION_REPORT_REJECTED",
        entityType: "IssueResolutionReport",
        entityId: report.id,
        metadata: {
          issueId: report.issue.id,
        },
      },
    });
  });

  revalidatePath(ISSUE_PAGE_PATH);
  revalidatePath(RESOLUTION_REPORTS_QUEUE_PATH);
  revalidatePath("/dashboard/caretaker/issues");
  revalidatePath("/dashboard/org/notifications");
  redirect(redirectTarget);
}
