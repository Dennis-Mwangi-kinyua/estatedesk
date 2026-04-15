"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "./_lib/queries";
import { buildIssuesHref, canAssignCaretakerRole } from "./_lib/helpers";
import { ISSUE_PAGE_PATH } from "./_lib/types";

export async function assignCaretakerAction(formData: FormData) {
  const issueId = String(formData.get("issueId") ?? "");
  const caretakerUserId = String(formData.get("caretakerUserId") ?? "");
  const page = String(formData.get("page") ?? "1");

  if (!issueId || !caretakerUserId) {
    redirect(ISSUE_PAGE_PATH);
  }

  const membership = await getCurrentOrgContext();

  if (!canAssignCaretakerRole(membership.role)) {
    redirect(buildIssuesHref(Number(page) || 1, issueId));
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
        },
      },
    },
  });

  if (!caretakerMembership) {
    redirect(buildIssuesHref(Number(page) || 1, issueId));
  }

  const issue = await prisma.issueTicket.findFirst({
    where: {
      id: issueId,
      orgId: membership.orgId,
    },
    select: {
      id: true,
    },
  });

  if (!issue) {
    redirect(buildIssuesHref(Number(page) || 1, issueId));
  }

  await prisma.issueTicket.update({
    where: {
      id: issue.id,
    },
    data: {
      assignedTo: {
        connect: {
          id: caretakerMembership.user.id,
        },
      },
      status: "IN_PROGRESS",
    },
  });

  revalidatePath(ISSUE_PAGE_PATH);
  redirect(buildIssuesHref(Number(page) || 1, issueId));
}

export async function updateIssueStatusAction(formData: FormData) {
  const issueId = String(formData.get("issueId") ?? "");
  const page = String(formData.get("page") ?? "1");
  const nextStatus = String(formData.get("status") ?? "") as TicketStatus;

  if (!issueId || !nextStatus) {
    redirect(ISSUE_PAGE_PATH);
  }

  const membership = await getCurrentOrgContext();

  const issue = await prisma.issueTicket.findFirst({
    where: {
      id: issueId,
      orgId: membership.orgId,
    },
    select: {
      id: true,
      resolvedAt: true,
    },
  });

  if (!issue) {
    redirect(buildIssuesHref(Number(page) || 1, issueId));
  }

  const data: {
    status: TicketStatus;
    resolvedAt?: Date | null;
  } = {
    status: nextStatus,
  };

  if (nextStatus === "RESOLVED") {
    data.resolvedAt = new Date();
  } else if (nextStatus === "CLOSED") {
    data.resolvedAt = issue.resolvedAt ?? new Date();
  } else {
    data.resolvedAt = null;
  }

  await prisma.issueTicket.update({
    where: {
      id: issue.id,
    },
    data,
  });

  revalidatePath(ISSUE_PAGE_PATH);
  redirect(buildIssuesHref(Number(page) || 1, issueId));
}