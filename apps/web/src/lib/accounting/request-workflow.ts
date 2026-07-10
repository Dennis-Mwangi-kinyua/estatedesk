import "server-only";

import type {
  AccountingRequestStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { notifyInAppAndPush } from "@/lib/notifications/notify";

type WorkflowDb = PrismaClient | Prisma.TransactionClient;

export async function nextAccountingRequestNumber(db: WorkflowDb, orgId: string) {
  const count = await db.accountingRequest.count({ where: { orgId } });
  const year = new Date().getUTCFullYear();
  return `AR-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function appendAccountingRequestEvent(
  db: WorkflowDb,
  input: {
    requestId: string;
    actorUserId?: string | null;
    status: AccountingRequestStatus;
    message?: string | null;
  },
) {
  return db.accountingRequestEvent.create({
    data: {
      requestId: input.requestId,
      actorUserId: input.actorUserId ?? null,
      status: input.status,
      message: input.message ?? null,
    },
  });
}

export async function getFinanceReviewerUserIds(db: WorkflowDb, orgId: string) {
  const memberships = await db.membership.findMany({
    where: {
      orgId,
      deactivatedAt: null,
      role: { in: ["ADMIN", "MANAGER", "ACCOUNTANT"] },
    },
    select: { userId: true },
  });

  return [...new Set(memberships.map((membership) => membership.userId))];
}

export async function notifyFinanceReviewers(
  db: WorkflowDb,
  input: {
    orgId: string;
    requestId: string;
    requestNumber: string;
    title: string;
    submitterName: string;
    excludeUserId?: string;
  },
) {
  const reviewerIds = (await getFinanceReviewerUserIds(db, input.orgId)).filter(
    (userId) => userId !== input.excludeUserId,
  );

  if (reviewerIds.length === 0) {
    return { count: 0 };
  }

  return notifyInAppAndPush({
    db,
    orgId: input.orgId,
    recipients: reviewerIds.map((userId) => ({ userId })),
    type: "ACCOUNTING_REQUEST_SUBMITTED",
    title: "New finance request",
    message: `${input.submitterName} submitted ${input.requestNumber}: ${input.title}`,
    actionUrl: `/dashboard/org/accounting/requests?focus=${input.requestId}`,
  });
}

export async function notifyRequestSubmitter(
  db: WorkflowDb,
  input: {
    orgId: string;
    userId: string;
    requestId: string;
    requestNumber: string;
    title: string;
    status: "APPROVED" | "REJECTED" | "PAID";
    feedback?: string | null;
    workspace: "caretaker" | "org";
  },
) {
  const basePath =
    input.workspace === "caretaker"
      ? "/dashboard/caretaker/finance-requests"
      : "/dashboard/org/finance-requests";

  const statusCopy =
    input.status === "APPROVED"
      ? "approved"
      : input.status === "REJECTED"
        ? "rejected"
        : "marked paid";

  const message = input.feedback
    ? `${input.requestNumber} was ${statusCopy}. Feedback: ${input.feedback}`
    : `${input.requestNumber} was ${statusCopy}.`;

  return notifyInAppAndPush({
    db,
    orgId: input.orgId,
    recipients: [{ userId: input.userId }],
    type:
      input.status === "REJECTED"
        ? "ACCOUNTING_REQUEST_REJECTED"
        : "ACCOUNTING_REQUEST_APPROVED",
    title: `Finance request ${statusCopy}`,
    message,
    actionUrl: `${basePath}?focus=${input.requestId}`,
  });
}