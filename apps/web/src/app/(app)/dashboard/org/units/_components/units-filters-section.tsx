import { DeferredLink } from "@/components/navigation/app-links";
import { Search } from "lucide-react";
import { buildPageHref } from "../_lib/helpers";
import type { UnitsPageData } from "../_lib/types";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  FilterPill,
  panelShellClassName,
} from "./units-ui";

export function UnitsFiltersSection({ data }: { data: UnitsPageData }) {
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
    filteredOccupied,
    filteredVacant,
    hasFilters,
  } = data;

  const resetHref = buildPageHref({
    property: propertyId ?? undefined,
    mix: mixKey ?? undefined,
  });

  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <form
        action="/dashboard/org/units"
        method="get"
        className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px_auto] lg:items-end"
      >
        {propertyId ? (
          <input type="hidden" name="property" value={propertyId} />
        ) : null}
        {mixKey ? <input type="hidden" name="mix" value={mixKey} /> : null}

        <div>
          <label
            htmlFor="units-search"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Search units
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="units-search"
              name="q"
              defaultValue={q}
              placeholder="Search by unit number, property, building, or location"
              className={`${fieldClassName} pl-11`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-medium text-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className={fieldClassName}
          >
            <option value="ALL">All statuses</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="VACANT">Vacant</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">Under maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="activity"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Availability
          </label>
          <select
            id="activity"
            name="activity"
            defaultValue={activity}
            className={fieldClassName}
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button type="submit" className={`${buttonPrimaryClassName} flex-1`}>
            Apply
          </button>
          <DeferredLink href={resetHref} className={buttonSecondaryClassName}>
            Reset
          </DeferredLink>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap gap-2">
          <FilterPill>
            Showing {showingFrom}–{showingTo} of {filteredTotal}
          </FilterPill>
          {view !== "properties" ? (
            <>
              <FilterPill tone="success">Occupied: {filteredOccupied}</FilterPill>
              <FilterPill tone="warning">Vacant: {filteredVacant}</FilterPill>
            </>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">
          {view === "properties"
            ? "Open a property card to browse apartment mixes and unit inventory."
            : view === "mixes"
              ? "Open a unit mix to see occupied and vacant units with pagination."
              : hasFilters
                ? "Filtered unit list for the selected mix."
                : "Use status tabs below to focus on occupied or vacant units."}
        </p>
      </div>
    </section>
  );
}