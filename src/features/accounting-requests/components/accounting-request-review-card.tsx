import Link from "next/link";
import {
  approveAccountingRequestAction,
  markAccountingRequestPaidAction,
  rejectAccountingRequestAction,
  startAccountingRequestReviewAction,
} from "../actions";
import {
  PAYABLES_ELIGIBLE_TYPES,
  REQUEST_TYPE_LABELS,
} from "../_lib/constants";
import {
  buttonDangerClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  formatDate,
  formatMoney,
  labelClassName,
} from "../_lib/helpers";
import type { AccountingRequestsQueueData } from "../_lib/types";
import { ReceiptAttachmentLink } from "./receipt-attachment-link";
import { RequestStatusBadge } from "./request-status-badge";

type ExpenseAccount = AccountingRequestsQueueData["expenseAccounts"][number];

type RequestRecord =
  | AccountingRequestsQueueData["pendingRequests"][number]
  | AccountingRequestsQueueData["recentDecisions"][number];

export function AccountingRequestReviewCard({
  request,
  propertyNames,
  expenseAccounts,
  focusId,
  compact = false,
}: {
  request: RequestRecord;
  propertyNames: Map<string, string>;
  expenseAccounts: ExpenseAccount[];
  focusId?: string;
  compact?: boolean;
}) {
  const isPending = request.status === "SUBMITTED" || request.status === "IN_REVIEW";
  const isFocused = focusId === request.id;
  const propertyName = request.propertyId
    ? propertyNames.get(request.propertyId)
    : null;
  const canPostToPayables = PAYABLES_ELIGIBLE_TYPES.includes(request.type);
  const defaultExpenseAccount =
    expenseAccounts.find(
      (account) =>
        account.systemKey ===
        (request.type === "REIMBURSEMENT" ? "MANAGEMENT_EXPENSE" : "OTHER_EXPENSE"),
    ) ?? expenseAccounts[0];

  return (
    <article
      id={`request-${request.id}`}
      className={`rounded-2xl border px-4 py-4 ${
        isFocused ? "border-primary bg-primary/5" : "border-border bg-muted/10"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{request.title}</h3>
            <RequestStatusBadge status={request.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {request.requestNumber} · {REQUEST_TYPE_LABELS[request.type]} ·{" "}
            {request.submittedBy.fullName} · {formatDate(request.createdAt)}
            {propertyName ? ` · ${propertyName}` : ""}
          </p>
        </div>
        <p className="text-sm font-semibold text-foreground">
          {formatMoney(Number(request.amount), request.currencyCode)}
        </p>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.description}</p>

      {(request.vendorName || request.payeeName || request.reference) && !compact ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {request.vendorName ? <span>Vendor: {request.vendorName}</span> : null}
          {request.payeeName ? <span>Payee: {request.payeeName}</span> : null}
          {request.reference ? <span>Ref: {request.reference}</span> : null}
        </div>
      ) : null}

      {request.attachmentKey ? (
        <div className="mt-3">
          <ReceiptAttachmentLink attachmentKey={request.attachmentKey} />
        </div>
      ) : null}

      {request.vendorBillId && !isPending ? (
        <p className="mt-3 text-xs font-medium text-emerald-700">
          Posted to payables · bill {request.requestNumber}
        </p>
      ) : null}

      {request.reviewerFeedback && !isPending ? (
        <div className="mt-3 rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground">
          <p className="font-semibold">Feedback sent</p>
          <p className="mt-1 leading-6">{request.reviewerFeedback}</p>
        </div>
      ) : null}

      {isPending ? (
        <div className="mt-4 space-y-4 border-t border-border/70 pt-4">
          {request.status === "SUBMITTED" ? (
            <form action={startAccountingRequestReviewAction}>
              <input type="hidden" name="requestId" value={request.id} />
              <button type="submit" className={buttonSecondaryClassName}>
                Start review
              </button>
            </form>
          ) : null}

          <form action={approveAccountingRequestAction} className="space-y-3">
            <input type="hidden" name="requestId" value={request.id} />

            {canPostToPayables && !compact ? (
              <>
                <label className="flex items-start gap-3 rounded-2xl border border-border bg-background px-3 py-3 text-sm">
                  <input
                    type="checkbox"
                    name="postToPayables"
                    defaultChecked
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold text-foreground">
                      Post to accounts payable on approval
                    </span>
                    <span className="mt-1 block text-muted-foreground">
                      Creates an approved vendor bill and accrual journal entry in the
                      ledger.
                    </span>
                  </span>
                </label>

                <label className={labelClassName}>
                  Expense account
                  <select
                    name="expenseAccountId"
                    defaultValue={defaultExpenseAccount?.id}
                    className={fieldClassName}
                  >
                    {expenseAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} · {account.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <input type="hidden" name="postToPayables" value="" />
            )}

            <label className={labelClassName}>
              Approval message to submitter
              <textarea
                name="feedback"
                rows={2}
                placeholder="e.g. Approved. Please bring the original receipt to the office."
                className={fieldClassName}
              />
            </label>
            {!compact ? (
              <label className={labelClassName}>
                Internal notes (accounts only)
                <textarea
                  name="internalNotes"
                  rows={2}
                  placeholder="Optional notes for the finance team."
                  className={fieldClassName}
                />
              </label>
            ) : (
              <input type="hidden" name="internalNotes" value="" />
            )}
            <button type="submit" className={buttonPrimaryClassName}>
              Approve request
            </button>
          </form>

          <form action={rejectAccountingRequestAction} className="space-y-3">
            <input type="hidden" name="requestId" value={request.id} />
            <label className={labelClassName}>
              Rejection feedback (required)
              <textarea
                name="feedback"
                required
                minLength={5}
                rows={2}
                placeholder="Explain what is missing or why this cannot be approved."
                className={fieldClassName}
              />
            </label>
            <button type="submit" className={buttonDangerClassName}>
              Reject request
            </button>
          </form>
        </div>
      ) : null}

      {request.status === "APPROVED" ? (
        <form
          action={markAccountingRequestPaidAction}
          className="mt-4 space-y-3 border-t border-border/70 pt-4"
        >
          <input type="hidden" name="requestId" value={request.id} />
          <label className={labelClassName}>
            Payment note to submitter
            <input
              name="feedback"
              placeholder="e.g. Paid via M-Pesa on 5 Jul."
              className={fieldClassName}
            />
          </label>
          {request.vendorBillId ? (
            <label className={labelClassName}>
              Paid from
              <select name="paymentMethod" className={fieldClassName} defaultValue="BANK">
                <option value="BANK">Bank</option>
                <option value="MPESA">M-Pesa</option>
                <option value="CASH">Cash</option>
              </select>
            </label>
          ) : null}
          <button type="submit" className={buttonPrimaryClassName}>
            {request.vendorBillId ? "Mark paid and settle bill" : "Mark as paid"}
          </button>
        </form>
      ) : null}

      {!compact ? (
        <p className="mt-3 text-xs text-muted-foreground">
          <Link
            href={`/dashboard/org/accounting/requests?focus=${request.id}`}
            className="font-medium text-primary hover:text-primary/80"
          >
            Open full review
          </Link>
        </p>
      ) : null}
    </article>
  );
}