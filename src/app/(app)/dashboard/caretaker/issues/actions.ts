"use server";

import { TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCaretakerIssueHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { uploadCompletionPhoto } from "@/features/issues/actions/upload-completion-photo";
import { getCaretakerManageableIssue } from "./_lib/access";

const CARETAKER_ISSUES_PATH = "/dashboard/caretaker/issues";
const CARETAKER_TODAY_PATH = "/dashboard/caretaker/today";

function getCaretakerIssueRedirect(issueId: string) {
  return getCaretakerIssueHref(issueId);
}

function revalidateCaretakerIssuePaths(issueId?: string) {
  revalidatePath(CARETAKER_ISSUES_PATH);
  revalidatePath(CARETAKER_TODAY_PATH);
  revalidatePath("/dashboard/caretaker/units");
  revalidatePath("/dashboard/org/issues");
  revalidatePath("/dashboard/org/notifications");

  if (issueId) {
    revalidatePath(getCaretakerIssueHref(issueId));
  }
}

function formatProgressStamp(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function startCaretakerIssueAction(formData: FormData) {
  const issueId = String(formData.get("issueId") ?? "");
  if (!issueId) redirect(CARETAKER_ISSUES_PATH);

  const session = await requireUserSession();
  if (!session.activeOrgId) redirect(CARETAKER_ISSUES_PATH);

  const issue = await getCaretakerManageableIssue({
    orgId: session.activeOrgId,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    issueId,
  });

  if (!issue || issue.status !== TicketStatus.OPEN) {
    redirect(CARETAKER_ISSUES_PATH);
  }

  await prisma.$transaction(async (tx) => {
    await tx.issueTicket.update({
      where: { id: issue.id },
      data: {
        status: TicketStatus.IN_PROGRESS,
        assignedToUserId: session.userId,
        assignedByUserId: session.userId,
      },
    });

    await notifyInAppAndPush({
      db: tx,
      orgId: issue.orgId,
      recipients: [{ userId: issue.reportedByUserId }],
      type: "GENERAL",
      title: "Issue work started",
      message: `A caretaker started work on "${issue.title}".`,
    });

    await tx.auditLog.create({
      data: {
        orgId: issue.orgId,
        actorUserId: session.userId,
        action: "ISSUE_STATUS_UPDATED",
        entityType: "IssueTicket",
        entityId: issue.id,
        metadata: {
          status: TicketStatus.IN_PROGRESS,
          source: "caretaker_portal",
        },
      },
    });
  });

  revalidateCaretakerIssuePaths(issue.id);
  redirect(getCaretakerIssueRedirect(issue.id));
}

export async function addCaretakerIssueProgressNoteAction(formData: FormData) {
  const issueId = String(formData.get("issueId") ?? "");
  const progressNote = String(formData.get("progressNote") ?? "").trim();

  if (!issueId || progressNote.length < 4) {
    redirect(CARETAKER_ISSUES_PATH);
  }

  const session = await requireUserSession();
  if (!session.activeOrgId) redirect(CARETAKER_ISSUES_PATH);

  const issue = await getCaretakerManageableIssue({
    orgId: session.activeOrgId,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    issueId,
  });

  if (!issue || issue.status !== TicketStatus.IN_PROGRESS) {
    redirect(CARETAKER_ISSUES_PATH);
  }

  const entry = `[${formatProgressStamp(new Date())}] ${progressNote}`;
  const resolutionNotes = issue.resolutionNotes
    ? `${issue.resolutionNotes}\n\n${entry}`
    : entry;

  await prisma.$transaction(async (tx) => {
    await tx.issueTicket.update({
      where: { id: issue.id },
      data: {
        resolutionNotes,
        assignedToUserId: session.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        orgId: issue.orgId,
        actorUserId: session.userId,
        action: "ISSUE_PROGRESS_NOTE_ADDED",
        entityType: "IssueTicket",
        entityId: issue.id,
        metadata: {
          source: "caretaker_portal",
        },
      },
    });
  });

  revalidateCaretakerIssuePaths(issue.id);
  redirect(getCaretakerIssueRedirect(issue.id));
}

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
      unitId: true,
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

  const photo = formData.get("photo");
  let reportId = "";

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
    reportId = report.id;

    await notifyInAppAndPush({
      db: tx,
      orgId: issue.orgId,
      recipients: officeMemberships.map(({ userId }) => ({ userId })),
      type: "GENERAL",
      title: "Issue completion report submitted",
      message: `A caretaker submitted a completion report for "${issue.title}". Review it before sending to the tenant for confirmation.`,
    });
  });

  let completionPhotoAssetId: string | undefined;

  if (photo instanceof File && photo.size > 0 && reportId) {
    completionPhotoAssetId = await uploadCompletionPhoto({
      photo,
      issueId: issue.id,
      reportId,
      unitId: issue.unitId ?? undefined,
      orgId: issue.orgId,
      submittedByUserId: session.userId,
    });
  }

  if (reportId) {
    await prisma.auditLog.create({
      data: {
        orgId: issue.orgId,
        actorUserId: session.userId,
        action: "ISSUE_RESOLUTION_REPORT_SUBMITTED",
        entityType: "IssueResolutionReport",
        entityId: reportId,
        metadata: {
          issueId: issue.id,
          completionPhotoAssetId: completionPhotoAssetId ?? null,
        },
      },
    });
  }

  revalidateCaretakerIssuePaths(issue.id);
  redirect(getCaretakerIssueRedirect(issue.id));
}
