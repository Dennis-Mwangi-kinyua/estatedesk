import Link from "next/link";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import type { OrgRole } from "@prisma/client";
import { Home } from "lucide-react";
import type { UnitsPageData } from "../_lib/types";
import { panelShellClassName } from "./units-ui";

export function UnitsEmptyState({
  data,
  orgRole,
}: {
  data: UnitsPageData;
  orgRole?: OrgRole | null;
}) {
  const { hasFilters, status } = data;

  return (
    <section className={panelShellClassName}>
      <div className="px-5 py-10 text-center sm:px-6 sm:py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
          <Home className="h-7 w-7 text-muted-foreground" />
        </div>

        <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          {hasFilters ? "No matching units found" : "No units on record yet"}
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          {hasFilters
            ? "Try adjusting your search or filters to find units in this portfolio."
            : "Units appear when properties and buildings are configured. Add inventory from the properties desk first."}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {hasFilters ? (
            <Link
              href="/dashboard/org/units"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Clear filters
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
            href="/dashboard/org/buildings"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            View buildings
          </Link>
        </div>

        {!hasFilters ? (
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 1
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Add properties</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Register each rental property with location and address details.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 2
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Create units</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add house numbers, rent amounts, and availability per unit.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step 3
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Fill vacancies</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Assign vacant units when onboarding tenants with active leases.
              </p>
            </div>
          </div>
        ) : null}

        {status === "VACANT" ? (
          <div className="mt-6 flex justify-center">
            <InAppGuideLink
              topic="vacancies"
              workspace="org"
              orgRole={orgRole}
              variant="card"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}