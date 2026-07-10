import { cancelAccountingRequestAction } from "../actions";
import { REQUEST_TYPE_LABELS } from "../_lib/constants";
import {
  buttonDangerClassName,
  formatDate,
  formatMoney,
} from "../_lib/helpers";
import type { FinanceRequestsPageData } from "../_lib/types";
import { ReceiptAttachmentLink } from "./receipt-attachment-link";
import { RequestStatusBadge } from "./request-status-badge";

export function FinanceRequestsList({
  data,
  workspace,
  focusId,
}: {
  data: FinanceRequestsPageData;
  workspace: "caretaker" | "org";
  focusId?: string;
}) {
  const { org, requests } = data;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        My finance requests
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Track submissions and read accountant feedback when requests are approved or
        rejected.
      </p>

      <div className="mt-5 space-y-4">
        {requests.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
            No finance requests submitted yet.
          </p>
        ) : (
          requests.map((request) => {
            const isFocused = focusId === request.id;
            const canCancel = request.status === "SUBMITTED" || request.status === "IN_REVIEW";

            return (
              <article
                key={request.id}
                id={`request-${request.id}`}
                className={`rounded-2xl border px-4 py-4 ${
                  isFocused
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/10"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {request.title}
                      </h3>
                      <RequestStatusBadge status={request.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {request.requestNumber} · {REQUEST_TYPE_LABELS[request.type]} ·{" "}
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatMoney(Number(request.amount), request.currencyCode)}
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {request.description}
                </p>

                {request.attachmentKey ? (
                  <div className="mt-3">
                    <ReceiptAttachmentLink attachmentKey={request.attachmentKey} />
                  </div>
                ) : null}

                {request.reviewerFeedback ? (
                  <div
                    className={`mt-3 rounded-2xl border px-3 py-3 text-sm ${
                      request.status === "REJECTED"
                        ? "border-rose-200 bg-rose-50 text-rose-900"
                        : "border-emerald-200 bg-emerald-50 text-emerald-900"
                    }`}
                  >
                    <p className="font-semibold">Accounts feedback</p>
                    <p className="mt-1 leading-6">{request.reviewerFeedback}</p>
                    {request.reviewedBy ? (
                      <p className="mt-2 text-xs opacity-80">
                        {request.reviewedBy.fullName}
                        {request.reviewedAt ? ` · ${formatDate(request.reviewedAt)}` : ""}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {request.events.length > 0 ? (
                  <div className="mt-3 border-t border-border/70 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Activity
                    </p>
                    <div className="mt-2 space-y-2">
                      {request.events.map((event) => (
                        <div key={event.id} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {event.actor?.fullName ?? "System"}
                          </span>{" "}
                          · {event.status}
                          {event.message ? ` — ${event.message}` : ""} ·{" "}
                          {formatDate(event.createdAt)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {canCancel ? (
                  <form action={cancelAccountingRequestAction} className="mt-4">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="workspace" value={workspace} />
                    <button type="submit" className={buttonDangerClassName}>
                      Cancel request
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}