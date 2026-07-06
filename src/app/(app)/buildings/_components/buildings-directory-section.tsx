import type { getBuildingsPageData } from "../_lib/queries";
import { BuildingDirectoryCard } from "./building-directory-card";
import { BuildingsEmptyState } from "./buildings-empty-state";
import { BuildingsPagination } from "./buildings-pagination";
import { panelShellClassName } from "./buildings-ui";

type BuildingsPageData = Awaited<ReturnType<typeof getBuildingsPageData>>;

export function BuildingsDirectorySection({ data }: { data: BuildingsPageData }) {
  const { buildings } = data;

  if (buildings.length === 0) {
    return (
      <>
        <BuildingsEmptyState data={data} />
        <BuildingsPagination data={data} />
      </>
    );
  }

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Building directory
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Occupancy, caretaker coverage, and unit previews for each building.
            </p>
          </div>

          <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {buildings.length} records
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {buildings.map((building) => (
          <BuildingDirectoryCard key={building.id} building={building} />
        ))}
      </div>

      <div className="border-t border-border px-5 py-4 sm:px-6">
        <BuildingsPagination data={data} />
      </div>
    </section>
  );
}