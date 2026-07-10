import Link from "next/link";
import { Inbox } from "lucide-react";
import type { AccountingRequestsQueueData } from "../_lib/types";
import { AccountingRequestReviewCard } from "./accounting-request-review-card";

export function AccountingRequestsQueue({
  data,
  focusId,
}: {
  data: AccountingRequestsQueueData;
  focusId?: string;
}) {
  const { pendingRequests, pendingCount } = data;

  return (
    <section className="rounded-2xl border border-border bg-muted/5">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              <Inbox className="h-5 w-5 text-primary" />
              Finance request queue
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Worker-submitted tickets awaiting accounts review, approval, and payment
              feedback.
            </p>
          </div>
          <Link
            href="/dashboard/org/accounting/requests"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/30"
          >
            Open full queue
            {pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Link>
        </div>
      </div>

      <div className="space-y-3 px-5 py-5">
        {pendingRequests.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
            No pending finance requests. Workers submit tickets from Finance requests
            in their dashboard.
          </p>
        ) : (
          pendingRequests.slice(0, 4).map((request) => (
            <AccountingRequestReviewCard
              key={request.id}
              request={request}
              propertyNames={data.propertyNames}
              expenseAccounts={data.expenseAccounts}
              focusId={focusId}
              compact
            />
          ))
        )}
      </div>
    </section>
  );
}