import Link from "next/link";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { ReceiptText } from "lucide-react";
import { getBillStatusClasses } from "@/app/(app)/dashboard/tenant/water-bills/_lib/helpers";
import { PaginationLink } from "@/app/(app)/dashboard/tenant/water-bills/_components/pagination-link";
import {
  HISTORY_PAGE_SIZE,
  type PreparedWaterBill,
} from "@/app/(app)/dashboard/tenant/water-bills/_lib/types";

export function BillsHistorySection({
  preparedBills,
  currentPage,
  totalPages,
}: {
  preparedBills: PreparedWaterBill[];
  currentPage: number;
  totalPages: number;
}) {
  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const historyEnd = historyStart + HISTORY_PAGE_SIZE;
  const paginatedHistory = preparedBills.slice(historyStart, historyEnd);

  return (
    <SurfaceCard className="p-4 sm:p-6 xl:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Bills History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Full history of your water bills with totals, due dates, and receipt
            access.
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="mt-5 space-y-3 lg:hidden">
        {paginatedHistory.map((bill) => (
          <div
            key={`history-${bill.id}`}
            className="rounded-[22px] ed-theme-card border border-border bg-muted/35 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {bill.period}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bill.unitLabel}
                </p>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBillStatusClasses(
                  bill.status,
                )}`}
              >
                {bill.statusLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Amount
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {bill.totalLabel}
                </p>
              </div>

              <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Due Date
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {bill.dueDateLabel}
                </p>
              </div>

              <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Units Used
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {bill.unitsUsed}
                </p>
              </div>

              <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Outstanding
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {bill.outstandingLabel}
                </p>
              </div>
            </div>

            {bill.receiptHref ? (
              <div className="mt-3">
                <Link
                  href={bill.receiptHref}
                  className="inline-flex items-center gap-2 rounded-[18px] border border-black/10 bg-card px-4 py-3 text-sm font-medium text-neutral-800"
                >
                  <ReceiptText className="h-4 w-4" />
                  Download Receipt
                </Link>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-[24px] ed-theme-card border border-border bg-card lg:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-5 py-4 font-medium">Period</th>
              <th className="px-5 py-4 font-medium">Property</th>
              <th className="px-5 py-4 font-medium">Units Used</th>
              <th className="px-5 py-4 font-medium">Amount</th>
              <th className="px-5 py-4 font-medium">Outstanding</th>
              <th className="px-5 py-4 font-medium">Due Date</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {paginatedHistory.map((bill) => (
              <tr
                key={bill.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-5 py-4 font-semibold text-foreground">
                  {bill.period}
                </td>
                <td className="px-5 py-4 text-neutral-600">{bill.unitLabel}</td>
                <td className="px-5 py-4 text-neutral-600">{bill.unitsUsed}</td>
                <td className="px-5 py-4 font-semibold text-foreground">
                  {bill.totalLabel}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {bill.outstandingLabel}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {bill.dueDateLabel}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getBillStatusClasses(
                      bill.status,
                    )}`}
                  >
                    {bill.statusLabel}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {bill.receiptHref ? (
                    <Link
                      href={bill.receiptHref}
                      className="inline-flex items-center gap-1 font-medium text-foreground hover:text-foreground/80"
                    >
                      Download
                    </Link>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
        <p className="text-sm text-muted-foreground">
          Showing {historyStart + 1}–
          {Math.min(historyEnd, preparedBills.length)} of {preparedBills.length}
        </p>

        <div className="flex flex-wrap gap-2">
          <PaginationLink
            page={currentPage - 1}
            currentPage={currentPage}
            disabled={currentPage === 1}
          >
            Previous
          </PaginationLink>

          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((page) => {
              if (totalPages <= 5) return true;
              if (page === 1 || page === totalPages) return true;
              return Math.abs(page - currentPage) <= 1;
            })
            .map((page, index, pages) => {
              const previousPage = pages[index - 1];
              const showGap = previousPage && page - previousPage > 1;

              return (
                <div key={page} className="flex items-center gap-2">
                  {showGap ? (
                    <span className="px-1 text-sm text-neutral-400">…</span>
                  ) : null}
                  <PaginationLink page={page} currentPage={currentPage}>
                    {page}
                  </PaginationLink>
                </div>
              );
            })}

          <PaginationLink
            page={currentPage + 1}
            currentPage={currentPage}
            disabled={currentPage === totalPages}
          >
            Next
          </PaginationLink>
        </div>
      </div>
    </SurfaceCard>
  );
}