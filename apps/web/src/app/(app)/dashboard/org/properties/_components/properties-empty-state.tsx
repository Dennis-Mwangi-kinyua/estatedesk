import Link from "next/link";
import { Home } from "lucide-react";
import type { PropertiesPageData } from "../_lib/types";
import { buildPageHref } from "../_lib/helpers";

export function PropertiesEmptyState({ data }: { data: PropertiesPageData }) {
  const { created, hasFilters } = data;
  const clearFiltersHref = buildPageHref({
    page: 1,
    created: created ? "1" : undefined,
  });

  return (
    <div className="px-5 py-10 text-center sm:px-6 sm:py-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
        <Home className="h-7 w-7 text-muted-foreground" />
      </div>

      <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
        {hasFilters ? "No matching properties" : "No properties yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? "Try adjusting your search terms or filters to find what you are looking for."
          : "Start by creating your first property. Once added, you can attach buildings, units, caretaker assignments, leases, and billing flows."}
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {hasFilters ? (
          <Link
            href={clearFiltersHref}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            Clear filters
          </Link>
        ) : null}

        <Link
          href="/dashboard/org/properties/new"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Create property
        </Link>
      </div>

      {!hasFilters ? (
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 1
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">Create property</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Add name, type, location, taxpayer profile, and water defaults.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 2
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">Add buildings</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Register apartment blocks under each property in the portfolio.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 3
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">Configure units</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Attach units, rent terms, and availability before onboarding tenants.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}