import { DeferredLink } from "@/components/navigation/app-links";
import { buildBuildingsPageHref } from "../_lib/helpers";
import type { getBuildingsPageData } from "../_lib/queries";

type BuildingsPageData = Awaited<ReturnType<typeof getBuildingsPageData>>;

export function BuildingsPagination({ data }: { data: BuildingsPageData }) {
  const {
    currentPage,
    totalPages,
    showingFrom,
    showingTo,
    totalBuildings,
    query,
  } = data;

  if (totalBuildings <= showingTo && currentPage === 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {showingFrom}–{showingTo} of {totalBuildings} buildings
      </p>

      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <DeferredLink
            href={buildBuildingsPageHref(currentPage - 1, query || undefined)}
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
            href={buildBuildingsPageHref(currentPage + 1, query || undefined)}
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