import { DeferredLink } from "@/components/navigation/app-links";
import { Search } from "lucide-react";
import type { getBuildingsPageData } from "../_lib/queries";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  panelShellClassName,
} from "./buildings-ui";

type BuildingsPageData = Awaited<ReturnType<typeof getBuildingsPageData>>;

export function BuildingsFiltersSection({ data }: { data: BuildingsPageData }) {
  const { query, buildings, totalBuildings } = data;

  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <form method="GET" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex flex-1 items-center">
            <span className="pointer-events-none absolute left-4 text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search building, property, location, unit, or caretaker..."
              className={`${fieldClassName} pl-11`}
            />
          </label>

          <div className="flex gap-2">
            <button type="submit" className={`${buttonPrimaryClassName} flex-1 sm:flex-none`}>
              Search
            </button>

            {query ? (
              <DeferredLink
                href="/dashboard/org/buildings"
                className={buttonSecondaryClassName}
              >
                Clear
              </DeferredLink>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Search across building names, properties, locations, units, and caretaker contacts.
        </p>

        {query ? (
          <p className="text-sm font-medium text-foreground">
            Showing {buildings.length} result{buildings.length === 1 ? "" : "s"} on this page
            for “{query}” ({totalBuildings} total matches)
          </p>
        ) : null}
      </form>
    </section>
  );
}