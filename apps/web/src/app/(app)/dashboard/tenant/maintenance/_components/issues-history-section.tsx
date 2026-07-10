import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { Home } from "lucide-react";
import {
  formatDate,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";
import { HISTORY_PAGE_SIZE } from "../_lib/types";
import type { TenantMaintenancePageData } from "../_lib/types";
import { PaginationLink } from "./pagination-link";

export function IssuesHistorySection({
  data,
  currentPage,
}: {
  data: TenantMaintenancePageData;
  currentPage: number;
}) {
  const { activeUnit, issues, totalPages } = data;

  if (!activeUnit) {
    return null;
  }

  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const historyEnd = historyStart + HISTORY_PAGE_SIZE;
  const paginatedIssues = issues.slice(historyStart, historyEnd);

  return (
    <SurfaceCard className="p-4 sm:p-6 xl:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Reported Issues
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All maintenance issues related to your current unit.
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {paginatedIssues.map((issue) => (
          <div
            key={issue.id}
            className="rounded-[22px] ed-theme-card border border-border bg-muted/35 p-4 sm:p-5"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
                      {issue.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                        issue.status,
                      )}`}
                    >
                      {issue.status.replaceAll("_", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                        issue.priority,
                      )}`}
                    >
                      {issue.priority}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {activeUnit.property.name} • Unit {activeUnit.houseNo}
                  </p>
                </div>
              </div>

              <div className="rounded-[18px] border border-border/60 bg-card px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="mt-1 text-sm text-foreground/80">
                  {issue.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[18px] border border-border/60 bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Created
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDate(issue.createdAt)}
                  </p>
                </div>

                <div className="rounded-[18px] border border-border/60 bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Assigned To
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {issue.assignedTo?.fullName ?? "Unassigned"}
                  </p>
                </div>
              </div>

              {issue.resolutionNotes ? (
                <div className="rounded-[18px] border border-border/60 bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Resolution Notes
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">
                    {issue.resolutionNotes}
                  </p>
                </div>
              ) : null}

              {issue.photoAsset ? (
                <div className="rounded-[18px] border border-border/60 bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Attachment
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">
                    Photo attached to this issue.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-card px-4 py-3 text-sm text-muted-foreground">
                  <Home className="mr-2 h-4 w-4" />
                  Current unit issue
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
        <p className="text-sm text-muted-foreground">
          Showing {historyStart + 1}–
          {Math.min(historyEnd, issues.length)} of {issues.length}
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