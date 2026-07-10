import Link from "next/link";
import { panelShellClassName } from "./caretaker-ui";

type ListPaginationProps = {
  currentPage: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalItems: number;
  buildHref: (page: number) => string;
};

export function ListPagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalItems,
  buildHref,
}: ListPaginationProps) {
  if (totalItems <= showingTo && currentPage === 1) {
    return null;
  }

  return (
    <section
      className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${panelShellClassName}`}
    >
      <p className="text-sm text-muted-foreground">
        Showing {showingFrom}-{showingTo} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/30"
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/20 px-4 text-sm font-semibold text-muted-foreground">
            Previous
          </span>
        )}

        <span className="rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm font-semibold text-foreground">
          {currentPage} / {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/30"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/20 px-4 text-sm font-semibold text-muted-foreground">
            Next
          </span>
        )}
      </div>
    </section>
  );
}