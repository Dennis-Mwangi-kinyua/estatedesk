"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AccountingRequestStatus,
  AccountingRequestType,
} from "@prisma/client";
import { postAccountingRequestToPayables } from "@/lib/accounting/post-request-to-payables";
import { ensureAccountingFoundation, postJournalEntry } from "@/lib/accounting/engine";
import {
  appendAccountingRequestEvent,
  nextAccountingRequestNumber,
  notifyFinanceReviewers,
  notifyRequestSubmitter,
} from "@/lib/accounting/request-workflow";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import {
  DEFAULT_EXPENSE_SYSTEM_KEY,
  FINANCE_REVIEW_ROLES,
  PAYABLES_ELIGIBLE_TYPES,
  WORKER_SUBMIT_ROLES,
} from "./_lib/constants";
import { uploadFinanceRequestReceipt } from "./_lib/upload-receipt";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

const amount = (form: FormData, key: string) => {
  const value = Number(text(form, key));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be greater than zero.`);
  }
  return value;
};

function parseRequestType(value: string): AccountingRequestType {
  return Object.values(AccountingRequestType).includes(value as AccountingRequestType)
    ? (value as AccountingRequestType)
    : AccountingRequestType.OTHER;
}

function workerRedirect(workspace: "caretaker" | "org", message: string) {
  const base =
    workspace === "caretaker"
      ? "/dashboard/caretaker/finance-requests"
      : "/dashboard/org/finance-requests";
  redirect(`${base}?message=${encodeURIComponent(message)}`);
}

function reviewRedirect(message: string, requestId?: string) {
  const suffix = requestId ? `&focus=${requestId}` : "";
  redirect(
    `/dashboard/org/accounting/requests?message=${encodeURIComponent(message)}${suffix}`,
  );
}

async function submitterWorkspace(userId: string, orgId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId, orgId, deactivatedAt: null },
    select: { role: true },
  });

  return membership?.role === "CARETAKER" ? "caretaker" : "org";
}

async function resolveExpenseAccountId(
  orgId: string,
  expenseAccountId: string,
  requestType: AccountingRequestType,
) {
  if (expenseAccountId) {
    const account = await prisma.accountingAccount.findFirst({
      where: { id: expenseAccountId, orgId, isActive: true, type: "EXPENSE" },
      select: { id: true },
    });
    if (account) return account.id;
  }

  const systemKey = DEFAULT_EXPENSE_SYSTEM_KEY[requestType];
  const fallback = await prisma.accountingAccount.findFirst({
    where: { orgId, isActive: true, systemKey },
    select: { id: true },
  });

  if (!fallback) {
    throw new Error("Select an expense account before posting to payables.");
  }

  return fallback.id;
}

function cashSystemKey(method: string) {
  if (method === "MPESA") return "MPESA";
  if (method === "CASH") return "CASH";
  return "BANK";
}

export async function submitAccountingRequestAction(formData: FormData) {
  const session = await requireOrgRole([...WORKER_SUBMIT_ROLES]);
  const orgId = session.activeOrgId!;
  const workspace = text(formData, "workspace") === "caretaker" ? "caretaker" : "org";
  const title = text(formData, "title");
  const description = text(formData, "description");
  const type = parseRequestType(text(formData, "type"));
  const total = amount(formData, "amount");
  const propertyId = text(formData, "propertyId") || null;
  const vendorName = text(formData, "vendorName") || null;
  const payeeName = text(formData, "payeeName") || null;
  const reference = text(formData, "reference") || null;

  if (title.length < 3 || description.length < 10) {
    throw new Error("Add a clear title and detailed description.");
  }

  const requestNumber = await nextAccountingRequestNumber(prisma, orgId);
  const receipt = formData.get("receipt");
  let attachmentKey: string | null = null;

  if (receipt instanceof File && receipt.size > 0) {
    attachmentKey = await uploadFinanceRequestReceipt({
      receipt,
      orgId,
      uploadedByUserId: session.userId,
      requestNumber,
    });
  }

  const request = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true },
    });

    const created = await tx.accountingRequest.create({
      data: {
        orgId,
        requestNumber,
        type,
        status: "SUBMITTED",
        title,
        description,
        amount: total,
        currencyCode: org.currencyCode,
        propertyId,
        vendorName,
        payeeName,
        reference,
        attachmentKey,
        submittedByUserId: session.userId,
      },
      include: {
        submittedBy: { select: { fullName: true } },
      },
    });

    await appendAccountingRequestEvent(tx, {
      requestId: created.id,
      actorUserId: session.userId,
      status: "SUBMITTED",
      message: attachmentKey
        ? "Request submitted to accounts with receipt attached."
        : "Request submitted to accounts.",
    });

    await notifyFinanceReviewers(tx, {
      orgId,
      requestId: created.id,
      requestNumber: created.requestNumber,
      title: created.title,
      submitterName: created.submittedBy.fullName,
      excludeUserId: session.userId,
    });

    return created;
  });

  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/requests");
  revalidatePath("/dashboard/org/finance-requests");
  revalidatePath("/dashboard/caretaker/finance-requests");

  workerRedirect(
    workspace,
    `Request ${request.requestNumber} submitted to accounts.`,
  );
}

export async function cancelAccountingRequestAction(formData: FormData) {
  const session = await requireOrgRole([...WORKER_SUBMIT_ROLES]);
  const orgId = session.activeOrgId!;
  const requestId = text(formData, "requestId");
  const workspace = text(formData, "workspace") === "caretaker" ? "caretaker" : "org";

  if (!requestId) {
    throw new Error("Request was not found.");
  }

  await prisma.$transaction(async (tx) => {
    const request = await tx.accountingRequest.findFirst({
      where: {
        id: requestId,
        orgId,
        submittedByUserId: session.userId,
        status: { in: ["SUBMITTED", "IN_REVIEW"] },
      },
    });

    if (!request) {
      throw new Error("Only pending requests can be cancelled.");
    }

    await tx.accountingRequest.update({
      where: { id: request.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    await appendAccountingRequestEvent(tx, {
      requestId: request.id,
      actorUserId: session.userId,
      status: "CANCELLED",
      message: "Cancelled by submitter.",
    });
  });

  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/requests");
  revalidatePath("/dashboard/org/finance-requests");
  revalidatePath("/dashboard/caretaker/finance-requests");

  workerRedirect(workspace, "Finance request cancelled.");
}

export async function startAccountingRequestReviewAction(formData: FormData) {
  const session = await requireOrgRole([...FINANCE_REVIEW_ROLES]);
  const orgId = session.activeOrgId!;
  const requestId = text(formData, "requestId");

  await prisma.$transaction(async (tx) => {
    const request = await tx.accountingRequest.findFirst({
      where: { id: requestId, orgId, status: "SUBMITTED" },
    });

    if (!request) {
      throw new Error("Request is no longer waiting for review.");
    }

    await tx.accountingRequest.update({
      where: { id: request.id },
      data: { status: "IN_REVIEW" },
    });

    await appendAccountingRequestEvent(tx, {
      requestId: request.id,
      actorUserId: session.userId,
      status: "IN_REVIEW",
      message: "Accounts picked up this request.",
    });
  });

  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/requests");
  reviewRedirect("Request moved to in review.", requestId);
}

export async function approveAccountingRequestAction(formData: FormData) {
  const session = await requireOrgRole([...FINANCE_REVIEW_ROLES]);
  const orgId = session.activeOrgId!;
  const requestId = text(formData, "requestId");
  const feedback = text(formData, "feedback") || null;
  const internalNotes = text(formData, "internalNotes") || null;
  const postToPayables = formData.get("postToPayables") === "on";
  const expenseAccountId = text(formData, "expenseAccountId");

  const request = await prisma.$transaction(async (tx) => {
    const existing = await tx.accountingRequest.findFirst({
      where: {
        id: requestId,
        orgId,
        status: { in: ["SUBMITTED", "IN_REVIEW"] },
      },
      include: { submittedBy: { select: { id: true, fullName: true } } },
    });

    if (!existing) {
      throw new Error("Request is no longer open for approval.");
    }

    let vendorBillId: string | null = null;
    let approvalMessage = feedback ?? "Approved by accounts.";

    if (postToPayables) {
      if (!PAYABLES_ELIGIBLE_TYPES.includes(existing.type)) {
        throw new Error("This request type cannot be posted to payables.");
      }

      const accountId = await resolveExpenseAccountId(
        orgId,
        expenseAccountId,
        existing.type,
      );

      vendorBillId = await postAccountingRequestToPayables(tx, {
        orgId,
        userId: session.userId,
        request: existing,
        expenseAccountId: accountId,
        payeeLabel: existing.submittedBy.fullName,
      });

      approvalMessage = [
        feedback,
        `Posted to accounts payable as bill ${existing.requestNumber}.`,
      ]
        .filter(Boolean)
        .join(" ");
    }

    const updated = await tx.accountingRequest.update({
      where: { id: existing.id },
      data: {
        status: "APPROVED",
        reviewedByUserId: session.userId,
        reviewedAt: new Date(),
        reviewerFeedback: approvalMessage,
        internalNotes,
        vendorBillId,
      },
      include: { submittedBy: { select: { id: true, fullName: true } } },
    });

    await appendAccountingRequestEvent(tx, {
      requestId: updated.id,
      actorUserId: session.userId,
      status: "APPROVED",
      message: approvalMessage,
    });

    const workspace = await submitterWorkspace(updated.submittedByUserId, orgId);

    await notifyRequestSubmitter(tx, {
      orgId,
      userId: updated.submittedByUserId,
      requestId: updated.id,
      requestNumber: updated.requestNumber,
      title: updated.title,
      status: "APPROVED",
      feedback: approvalMessage,
      workspace,
    });

    return updated;
  });

  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/requests");
  revalidatePath("/dashboard/org/finance-requests");
  revalidatePath("/dashboard/caretaker/finance-requests");

  const suffix = request.vendorBillId ? " and posted to payables." : ".";
  reviewRedirect(`Approved ${request.requestNumber}${suffix}`, requestId);
}

export async function rejectAccountingRequestAction(formData: FormData) {
  const session = await requireOrgRole([...FINANCE_REVIEW_ROLES]);
  const orgId = session.activeOrgId!;
  const requestId = text(formData, "requestId");
  const feedback = text(formData, "feedback");

  if (feedback.length < 5) {
    throw new Error("Add feedback so the submitter knows what to fix.");
  }

  const request = await prisma.$transaction(async (tx) => {
    const existing = await tx.accountingRequest.findFirst({
      where: {
        id: requestId,
        orgId,
        status: { in: ["SUBMITTED", "IN_REVIEW"] },
      },
    });

    if (!existing) {
      throw new Error("Request is no longer open for rejection.");
    }

    const updated = await tx.accountingRequest.update({
      where: { id: existing.id },
      data: {
        status: "REJECTED",
        reviewedByUserId: session.userId,
        reviewedAt: new Date(),
        reviewerFeedback: feedback,
      },
    });

    await appendAccountingRequestEvent(tx, {
      requestId: updated.id,
      actorUserId: session.userId,
      status: "REJECTED",
      message: feedback,
    });

    const workspace = await submitterWorkspace(updated.submittedByUserId, orgId);

    await notifyRequestSubmitter(tx, {
      orgId,
      userId: updated.submittedByUserId,
      requestId: updated.id,
      requestNumber: updated.requestNumber,
      title: updated.title,
      status: "REJECTED",
      feedback,
      workspace,
    });

    return updated;
  });

  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/requests");
  revalidatePath("/dashboard/org/finance-requests");
  revalidatePath("/dashboard/caretaker/finance-requests");
  reviewRedirect(`Rejected ${request.requestNumber}.`, requestId);
}

export async function markAccountingRequestPaidAction(formData: FormData) {
  const session = await requireOrgRole([...FINANCE_REVIEW_ROLES]);
  const orgId = session.activeOrgId!;
  const requestId = text(formData, "requestId");
  const feedback = text(formData, "feedback") || null;
  const paymentMethod = text(formData, "paymentMethod") || "BANK";

  const request = await prisma.$transaction(async (tx) => {
    const existing = await tx.accountingRequest.findFirst({
      where: { id: requestId, orgId, status: "APPROVED" },
    });

    if (!existing) {
      throw new Error("Only approved requests can be marked paid.");
    }

    if (existing.vendorBillId) {
      const bill = await tx.accountingVendorBill.findFirst({
        where: {
          id: existing.vendorBillId,
          orgId,
          status: { in: ["APPROVED", "PARTIAL"] },
        },
        include: { vendor: true },
      });

      if (bill) {
        await ensureAccountingFoundation(tx, orgId);
        const balanceDue = Number(bill.total) - Number(bill.amountPaid);

        if (balanceDue > 0.01) {
          await postJournalEntry({
            db: tx,
            orgId,
            entryDate: new Date(),
            description: `Payment to ${bill.vendor.name} · ${bill.billNumber}`,
            sourceType: "BILL_PAYMENT",
            sourceId: `${bill.id}:${Date.now()}`,
            userId: session.userId,
            lines: [
              {
                systemKey: "ACCOUNTS_PAYABLE",
                debit: balanceDue,
                propertyId: bill.propertyId,
                vendorId: bill.vendorId,
              },
              {
                systemKey: cashSystemKey(paymentMethod),
                credit: balanceDue,
                propertyId: bill.propertyId,
                vendorId: bill.vendorId,
              },
            ],
          });

          await tx.accountingVendorBill.update({
            where: { id: bill.id },
            data: {
              amountPaid: bill.total,
              status: "PAID",
            },
          });
        }
      }
    }

    const paymentMessage = [
      feedback,
      existing.vendorBillId ? "Linked vendor bill marked paid in the ledger." : null,
    ]
      .filter(Boolean)
      .join(" ");

    const updated = await tx.accountingRequest.update({
      where: { id: existing.id },
      data: {
        status: "PAID",
        reviewerFeedback: paymentMessage || existing.reviewerFeedback,
      },
    });

    await appendAccountingRequestEvent(tx, {
      requestId: updated.id,
      actorUserId: session.userId,
      status: "PAID",
      message: paymentMessage || "Payment recorded by accounts.",
    });

    const workspace = await submitterWorkspace(updated.submittedByUserId, orgId);

    await notifyRequestSubmitter(tx, {
      orgId,
      userId: updated.submittedByUserId,
      requestId: updated.id,
      requestNumber: updated.requestNumber,
      title: updated.title,
      status: "PAID",
      feedback: paymentMessage || feedback,
      workspace,
    });

    return updated;
  });

  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/requests");
  revalidatePath("/dashboard/org/finance-requests");
  revalidatePath("/dashboard/caretaker/finance-requests");
  reviewRedirect(`Marked ${request.requestNumber} as paid.`, requestId);
}