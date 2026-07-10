import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { Home } from "lucide-react";
import { PaginationLink } from "@/app/(app)/dashboard/tenant/inspections/_components/pagination-link";
import { ReportButton } from "@/app/(app)/dashboard/tenant/inspections/_components/report-button";
import {
  getInspectionStatusClasses,
  getNoticeStatusClasses,
} from "@/app/(app)/dashboard/tenant/inspections/_lib/helpers";
import {
  HISTORY_PAGE_SIZE,
  type PreparedNotice,
} from "@/app/(app)/dashboard/tenant/inspections/_lib/types";

function NoticeMobileCard({ notice }: { notice: PreparedNotice }) {
  return (
    <div className="rounded-[22px] ed-theme-card border border-border bg-muted/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {notice.unitLabel}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Move-out date: {notice.moveOutDateLabel}
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getNoticeStatusClasses(
            notice.noticeStatus,
          )}`}
        >
          {notice.noticeStatusLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Notice Date
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {notice.noticeDateLabel}
          </p>
        </div>

        <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Inspection
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {notice.inspectionScheduledAtLabel}
          </p>
        </div>
      </div>

      {notice.inspectionStatus ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getInspectionStatusClasses(
                notice.inspectionStatus,
              )}`}
            >
              {notice.inspectionStatusLabel}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Inspector
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {notice.inspectorName ?? "—"}
              </p>
            </div>

            <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Completed
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {notice.inspectionCompletedAtLabel}
              </p>
            </div>
          </div>

          {notice.inspectionNotes ? (
            <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Inspection Notes
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                {notice.inspectionNotes}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Inspection
          </p>
          <p className="mt-1 text-sm text-foreground/80">
            This move-out notice has not been scheduled for inspection yet.
          </p>
        </div>
      )}

      {notice.noticeNotes ? (
        <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Notice Notes
          </p>
          <p className="mt-1 text-sm text-foreground/80">{notice.noticeNotes}</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-card px-4 py-3 text-sm text-muted-foreground">
          <Home className="mr-2 h-4 w-4" />
          Move-out inspection flow
        </span>

        {notice.inspectionId ? (
          <ReportButton
            inspectionId={notice.inspectionId}
            completed={notice.inspectionStatus === "COMPLETED"}
          />
        ) : (
          <ReportButton inspectionId="" disabled />
        )}
      </div>
    </div>
  );
}

export function InspectionsHistorySection({
  preparedNotices,
  currentPage,
  totalPages,
}: {
  preparedNotices: PreparedNotice[];
  currentPage: number;
  totalPages: number;
}) {
  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const historyEnd = historyStart + HISTORY_PAGE_SIZE;
  const paginatedNotices = preparedNotices.slice(historyStart, historyEnd);

  return (
    <SurfaceCard className="p-4 sm:p-6 xl:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Inspection History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Move-out notices and any linked inspections for your tenancy.
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="mt-5 space-y-3 lg:hidden">
        {paginatedNotices.map((notice) => (
          <NoticeMobileCard key={notice.id} notice={notice} />
        ))}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-[24px] ed-theme-card border border-border bg-card lg:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-5 py-4 font-medium">Unit</th>
              <th className="px-5 py-4 font-medium">Move-Out Date</th>
              <th className="px-5 py-4 font-medium">Notice Status</th>
              <th className="px-5 py-4 font-medium">Inspection</th>
              <th className="px-5 py-4 font-medium">Inspection Status</th>
              <th className="px-5 py-4 font-medium">Inspector</th>
              <th className="px-5 py-4 font-medium">Completed</th>
              <th className="px-5 py-4 font-medium">Report</th>
            </tr>
          </thead>
          <tbody>
            {paginatedNotices.map((notice) => (
              <tr
                key={notice.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-5 py-4 font-semibold text-foreground">
                  {notice.unitLabel}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {notice.moveOutDateLabel}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getNoticeStatusClasses(
                      notice.noticeStatus,
                    )}`}
                  >
                    {notice.noticeStatusLabel}
                  </span>
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {notice.inspectionScheduledAtLabel}
                </td>
                <td className="px-5 py-4">
                  {notice.inspectionStatus ? (
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getInspectionStatusClasses(
                        notice.inspectionStatus,
                      )}`}
                    >
                      {notice.inspectionStatusLabel}
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {notice.inspectorName ?? "—"}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {notice.inspectionCompletedAtLabel}
                </td>
                <td className="px-5 py-4">
                  {notice.inspectionId ? (
                    <ReportButton
                      inspectionId={notice.inspectionId}
                      completed={notice.inspectionStatus === "COMPLETED"}
                    />
                  ) : (
                    <ReportButton inspectionId="" disabled />
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
          {Math.min(historyEnd, preparedNotices.length)} of{" "}
          {preparedNotices.length}
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