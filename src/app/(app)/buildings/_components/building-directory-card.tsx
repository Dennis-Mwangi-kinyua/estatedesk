import { DeferredLink } from "@/components/navigation/app-links";
import { deleteBuildingAction } from "@/app/(app)/dashboard/org/buildings/actions";
import { formatDate } from "../_lib/helpers";
import type { getBuildingsPageData } from "../_lib/queries";
import { BuildingStatusPill } from "./buildings-ui";

type Building = Awaited<ReturnType<typeof getBuildingsPageData>>["buildings"][number];

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export function BuildingDirectoryCard({ building }: { building: Building }) {
  const occupied = building.units.filter((unit) => unit.status === "OCCUPIED").length;
  const vacant = building.units.filter((unit) => unit.status === "VACANT").length;
  const activeUnits = building.units.filter((unit) => unit.isActive).length;

  const occupancyRate = building.units.length
    ? Math.round((occupied / building.units.length) * 100)
    : 0;

  const primaryCaretaker =
    building.caretakerAssignments.find((assignment) => assignment.isPrimary) ??
    building.caretakerAssignments[0];

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-ring sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {building.name}
            </h3>
            <BuildingStatusPill active={building.isActive} />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Property:</span>{" "}
              <DeferredLink
                href={`/dashboard/org/properties/${building.property.id}`}
                className="font-medium text-primary transition hover:text-primary/80"
              >
                {building.property.name}
              </DeferredLink>
            </p>

            {(building.property.location || building.property.address) && (
              <p>
                {[building.property.location, building.property.address]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}

            {building.notes ? (
              <p className="max-w-2xl leading-6">{building.notes}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
          <MetricCard
            label="Units"
            value={building.units.length}
            note={`${activeUnits} active`}
          />
          <MetricCard
            label="Occupancy"
            value={`${occupancyRate}%`}
            note={`${occupied} occupied • ${vacant} vacant`}
          />
          <MetricCard
            label="Caretaker"
            value={primaryCaretaker?.caretaker.fullName ?? "Not assigned"}
            note={primaryCaretaker?.caretaker.phone ?? "No phone number"}
          />
          <MetricCard
            label="Created"
            value={formatDate(building.createdAt)}
            note="Building record"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-muted/10 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-foreground">Units preview</h4>
          <span className="text-xs text-muted-foreground">{building.units.length} total</span>
        </div>

        {building.units.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No units added to this building yet.
          </p>
        ) : (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {building.units.slice(0, 12).map((unit) => (
              <span
                key={unit.id}
                className="inline-flex shrink-0 items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {unit.houseNo} • {unit.status}
              </span>
            ))}

            {building.units.length > 12 ? (
              <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
                +{building.units.length - 12} more
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <form action={deleteBuildingAction}>
          <input type="hidden" name="buildingId" value={building.id} />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
          >
            Delete building
          </button>
        </form>
      </div>
    </article>
  );
}