import { DeferredLink } from "@/components/navigation/app-links";
import { getOrgUnitHref } from "@/lib/units/url";
import { deleteUnitAction } from "../actions";
import { buildPageHref } from "../_lib/helpers";
import type { UnitsPageData } from "../_lib/types";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  FilterPill,
  formatCurrency,
  formatEnumLabel,
  formatUnitTypeLabel,
  panelShellClassName,
  statusClasses,
} from "./units-ui";

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "VACANT", label: "Vacant" },
  { value: "RESERVED", label: "Reserved" },
  { value: "UNDER_MAINTENANCE", label: "Maintenance" },
] as const;

export function UnitsUnitListSection({
  data,
}: {
  data: Extract<UnitsPageData, { view: "units" }>;
}) {
  const {
    selectedProperty,
    selectedMix,
    units,
    currencyCode,
    q,
    status,
    activity,
    propertyId,
    mixKey,
  } = data;

  if (!selectedProperty || !selectedMix) return null;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border bg-muted/10 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {selectedProperty.name}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          {selectedMix.label}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Review individual units, filter by occupancy status, and open unit records.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <DeferredLink
              key={tab.value}
              href={buildPageHref({
                property: propertyId ?? undefined,
                mix: mixKey ?? undefined,
                q: q || undefined,
                status: tab.value,
                activity,
                page: 1,
              })}
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                status === tab.value
                  ? "border-primary/40 bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/30"
              }`}
            >
              {tab.label}
            </DeferredLink>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border">
        {units.map((unit) => (
          <article
            key={unit.id}
            className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DeferredLink
                  href={getOrgUnitHref({
                    id: unit.id,
                    houseNo: unit.houseNo,
                    buildingName: unit.building?.name,
                    propertyName: selectedProperty.name,
                  })}
                  className="text-base font-semibold text-foreground transition hover:text-primary"
                >
                  Unit {unit.houseNo}
                </DeferredLink>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                    unit.status,
                  )}`}
                >
                  {formatEnumLabel(unit.status)}
                </span>
                {!unit.isActive ? (
                  <FilterPill tone="info">Inactive</FilterPill>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {unit.building?.name ?? "No building"} ·{" "}
                {formatUnitTypeLabel(unit.type, unit.bedrooms)}
                {unit.bedrooms ? ` · ${unit.bedrooms} bed` : ""}
                {unit.bathrooms ? ` · ${unit.bathrooms} bath` : ""}
              </p>

              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatCurrency(unit.rentAmount, currencyCode)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <DeferredLink
                href={getOrgUnitHref({
                  id: unit.id,
                  houseNo: unit.houseNo,
                  buildingName: unit.building?.name,
                  propertyName: selectedProperty.name,
                })}
                className={buttonPrimaryClassName}
              >
                View unit
              </DeferredLink>

              <form action={deleteUnitAction} className="inline">
                <input type="hidden" name="unitId" value={unit.id} />
                <button
                  type="submit"
                  className={buttonSecondaryClassName}
                >
                  Delete
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}