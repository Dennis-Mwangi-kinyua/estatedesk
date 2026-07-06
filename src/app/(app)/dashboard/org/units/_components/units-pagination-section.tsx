import { DeferredLink } from "@/components/navigation/app-links";
import { buildPageHref } from "../_lib/helpers";
import type { UnitsPageData } from "../_lib/types";
import { panelShellClassName } from "./units-ui";

export function UnitsPaginationSection({ data }: { data: UnitsPageData }) {
  const {
    view,
    q,
    status,
    activity,
    propertyId,
    mixKey,
    showingFrom,
    showingTo,
    filteredTotal,
    currentPage,
    totalPages,
  } = data;

  if (totalPages <= 1) {
    return null;
  }

  const baseParams = {
    q: q || undefined,
    status,
    activity,
    property: propertyId ?? undefined,
    mix: mixKey ?? undefined,
  };

  const prevHref = buildPageHref({
    ...baseParams,
    page: currentPage - 1,
  });
  const nextHref = buildPageHref({
    ...baseParams,
    page: currentPage + 1,
  });

  const pageLabel =
    view === "properties"
      ? "properties"
      : view === "units"
        ? "units"
        : "results";

  return (
    <section className={`${panelShellClassName} px-5 py-4 sm:px-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {showingFrom}–{showingTo} of {filteredTotal} matching {pageLabel}
        </p>

        <div className="flex items-center gap-3">
          {currentPage > 1 ? (
            <DeferredLink
              href={prevHref}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              Previous
            </DeferredLink>
          ) : (
            <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
              Previous
            </span>
          )}

          <span className="rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-sm font-semibold text-foreground">
            {currentPage} / {totalPages}
          </span>

          {currentPage < totalPages ? (
            <DeferredLink
              href={nextHref}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              Next
            </DeferredLink>
          ) : (
            <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
              Next
            </span>
          )}
        </div>
      </div>
    </section>
  );
}