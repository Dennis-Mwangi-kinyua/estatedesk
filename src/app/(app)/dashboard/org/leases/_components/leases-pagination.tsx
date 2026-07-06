import { DeferredLink } from "@/components/navigation/app-links";
import { buildLeasesPageHref } from "../_lib/helpers";

type LeasesPaginationProps = {
  currentPage: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalLeases: number;
};

export function LeasesPagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalLeases,
}: LeasesPaginationProps) {
  if (totalLeases <= showingTo && currentPage === 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {showingFrom}–{showingTo} of {totalLeases} leases
      </p>

      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <DeferredLink
            href={buildLeasesPageHref(currentPage - 1)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            Previous
          </DeferredLink>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
            Previous
          </span>
        )}

        <span className="rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm font-semibold text-foreground">
          {currentPage} / {totalPages}
        </span>

        {currentPage < totalPages ? (
          <DeferredLink
            href={buildLeasesPageHref(currentPage + 1)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            Next
          </DeferredLink>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
            Next
          </span>
        )}
      </div>
    </div>
  );
}