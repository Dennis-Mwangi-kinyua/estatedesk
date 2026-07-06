import Link from "next/link";
import { buildMoveOutsPageHref } from "../_lib/helpers";

type MoveOutsPaginationProps = {
  currentPage: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalNotices: number;
  basePath?: string;
};

export function MoveOutsPagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalNotices,
  basePath = "/dashboard/org/move-outs",
}: MoveOutsPaginationProps) {
  if (totalNotices <= showingTo && currentPage === 1) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-background px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {showingFrom}-{showingTo} of {totalNotices} notices
      </p>

      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildMoveOutsPageHref(currentPage - 1, basePath)}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border bg-muted px-4 text-sm font-medium text-muted-foreground">
            Previous
          </span>
        )}

        <span className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold">
          {currentPage} / {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={buildMoveOutsPageHref(currentPage + 1, basePath)}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border bg-muted px-4 text-sm font-medium text-muted-foreground">
            Next
          </span>
        )}
      </div>
    </section>
  );
}