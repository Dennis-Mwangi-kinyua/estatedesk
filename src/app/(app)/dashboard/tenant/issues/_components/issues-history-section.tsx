import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { IssueHistoryMobile } from "@/app/(app)/dashboard/tenant/issues/_components/issue-history-mobile";
import { IssueHistoryTable } from "@/app/(app)/dashboard/tenant/issues/_components/issue-history-table";
import { PaginationLink } from "@/app/(app)/dashboard/tenant/issues/_components/pagination-link";
import {
  HISTORY_PAGE_SIZE,
  type TenantIssuesPageData,
} from "@/app/(app)/dashboard/tenant/issues/_lib/types";

export function IssuesHistorySection({
  data,
  currentPage,
}: {
  data: TenantIssuesPageData;
  currentPage: number;
}) {
  const { issues, totalPages } = data;
  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const historyEnd = historyStart + HISTORY_PAGE_SIZE;
  const paginatedIssues = issues.slice(historyStart, historyEnd);

  return (
    <SurfaceCard className="p-4 sm:p-6 xl:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Issue History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All issue tickets raised for your unit(s).
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <IssueHistoryMobile issues={paginatedIssues} />
      <IssueHistoryTable issues={paginatedIssues} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
        <p className="text-sm text-muted-foreground">
          Showing {historyStart + 1}–{Math.min(historyEnd, issues.length)} of{" "}
          {issues.length}
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