import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import type { getAccountingRequestsReviewPageData } from "../_lib/queries";
import { AccountingRequestReviewCard } from "./accounting-request-review-card";

type ReviewPageData = Awaited<ReturnType<typeof getAccountingRequestsReviewPageData>>;

export function AccountingRequestsReviewWorkspace({
  data,
  message,
  focusId,
}: {
  data: ReviewPageData;
  message?: string;
  focusId?: string;
}) {
  const pendingCount =
    (data.statusCounts.SUBMITTED ?? 0) + (data.statusCounts.IN_REVIEW ?? 0);

  return (
    <div className="org-theme-content mx-auto w-full max-w-6xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <Link
            href="/dashboard/org/accounting"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to accounting
          </Link>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Inbox className="h-3.5 w-3.5" />
            ERP request desk
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Finance request queue
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Review worker tickets for {data.org.name}, approve or reject with feedback,
            then mark approved items paid when disbursement is complete.
          </p>
        </div>

        {message ? (
          <div className="border-b border-border bg-muted/15 px-5 py-4 sm:px-6">
            <p className="text-sm leading-6 text-foreground">{message}</p>
          </div>
        ) : null}

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-4 sm:px-6">
          {[
            ["Pending", pendingCount],
            ["Approved", data.statusCounts.APPROVED ?? 0],
            ["Rejected", data.statusCounts.REJECTED ?? 0],
            ["Paid", data.statusCounts.PAID ?? 0],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-muted/10 px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        {data.requests.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No finance requests yet.
          </p>
        ) : (
          data.requests.map((request) => (
            <AccountingRequestReviewCard
              key={request.id}
              request={request}
              propertyNames={data.propertyNames}
              expenseAccounts={data.expenseAccounts}
              focusId={focusId}
            />
          ))
        )}
      </div>
    </div>
  );
}