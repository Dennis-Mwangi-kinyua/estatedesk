import Link from "next/link";
import { buildIssuesHref } from "../_lib/helpers";

function PaginationLink({
  page,
  currentPage,
  selectedIssueId,
  children,
  disabled = false,
}: {
  page: number;
  currentPage: number;
  selectedIssueId?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center rounded-[16px] border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-400">
        {children}
      </span>
    );
  }

  const active =
    page === currentPage
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50";

  return (
    <Link
      href={buildIssuesHref(page, selectedIssueId)}
      className={`inline-flex items-center rounded-[16px] border px-3 py-2 text-sm font-medium ${active}`}
    >
      {children}
    </Link>
  );
}

export function IssuesPagination({
  currentPage,
  totalPages,
  totalItems,
  historyStart,
  historyEnd,
  selectedIssueId,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  historyStart: number;
  historyEnd: number;
  selectedIssueId?: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
      <p className="text-sm text-neutral-500">
        Showing {historyStart + 1}–{Math.min(historyEnd, totalItems)} of{" "}
        {totalItems}
      </p>

      <div className="flex flex-wrap gap-2">
        <PaginationLink
          page={currentPage - 1}
          currentPage={currentPage}
          selectedIssueId={selectedIssueId}
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
                <PaginationLink
                  page={page}
                  currentPage={currentPage}
                  selectedIssueId={selectedIssueId}
                >
                  {page}
                </PaginationLink>
              </div>
            );
          })}

        <PaginationLink
          page={currentPage + 1}
          currentPage={currentPage}
          selectedIssueId={selectedIssueId}
          disabled={currentPage === totalPages}
        >
          Next
        </PaginationLink>
      </div>
    </div>
  );
}