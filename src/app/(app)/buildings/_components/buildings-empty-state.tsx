import Link from "next/link";
import { Building2 } from "lucide-react";
import type { getBuildingsPageData } from "../_lib/queries";
import { panelShellClassName } from "./buildings-ui";

type BuildingsPageData = Awaited<ReturnType<typeof getBuildingsPageData>>;

export function BuildingsEmptyState({ data }: { data: BuildingsPageData }) {
  const hasSearch = Boolean(data.query.trim());

  return (
    <section className={panelShellClassName}>
      <div className="px-5 py-10 text-center sm:px-6 sm:py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
          <Building2 className="h-7 w-7 text-muted-foreground" />
        </div>

        <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          {hasSearch ? "No buildings found" : "No buildings on record yet"}
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          {hasSearch
            ? "Try another search term for the building, property, unit, or caretaker."
            : "Buildings are created under properties. Add properties first, then register apartment blocks and attach units."}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {hasSearch ? (
            <Link
              href="/dashboard/org/buildings"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Clear search
            </Link>
          ) : (
            <Link
              href="/dashboard/org/properties"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              View properties
            </Link>
          )}
          <Link
            href="/dashboard/org/units"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            View units
          </Link>
        </div>

        {!hasSearch ? (
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 1
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Add properties</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Register rental properties with location and address details.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 2
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Create buildings</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add apartment blocks or building records under each property.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 3
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Attach units</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add house numbers and rent terms, then track occupancy from units.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}