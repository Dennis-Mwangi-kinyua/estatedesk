import { ArrowUpRight, Bath, BedDouble, Building2, DoorOpen, Pencil, Trash2 } from "lucide-react";
import type { OrgRole } from "@prisma/client";
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
  data, orgRole,
}: {
  orgRole?: OrgRole | null;
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

      <div className="grid grid-cols-1 items-stretch gap-4 bg-muted/10 p-4 md:grid-cols-2 xl:grid-cols-3 sm:gap-5 sm:p-6">
        {units.map((unit) => {
          const href = getOrgUnitHref({
            id: unit.id,
            houseNo: unit.houseNo,
            buildingName: unit.building?.name,
            propertyName: selectedProperty.name,
          });
          return (
            <article
              key={unit.id}
              aria-label={`Unit ${unit.houseNo}`}
              className="group flex min-w-0 flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex min-w-0 flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
                    <DoorOpen className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex min-w-0 flex-wrap justify-end gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(unit.status)}`}>
                      {formatEnumLabel(unit.status)}
                    </span>
                    {!unit.isActive ? <FilterPill tone="info">Inactive</FilterPill> : null}
                  </div>
                </div>

                <h3 className="mt-4 break-words text-lg font-semibold tracking-tight text-foreground">
                  <DeferredLink href={href} className="rounded-sm transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Unit {unit.houseNo}
                  </DeferredLink>
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{formatUnitTypeLabel(unit.type, unit.bedrooms)}</p>
                <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 break-words">{unit.building?.name ?? "No building assigned"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  {unit.bedrooms != null && unit.bedrooms > 0 ? (
                    <span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4" aria-hidden="true" />{unit.bedrooms} {unit.bedrooms === 1 ? "bedroom" : "bedrooms"}</span>
                  ) : null}
                  {unit.bathrooms != null && unit.bathrooms > 0 ? (
                    <span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4" aria-hidden="true" />{unit.bathrooms} {unit.bathrooms === 1 ? "bathroom" : "bathrooms"}</span>
                  ) : null}
                </div>

                <div className="mt-auto pt-5">
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground">Monthly rent</p>
                    <p className="mt-1 break-words text-xl font-semibold tracking-tight text-foreground tabular-nums">{formatCurrency(unit.rentAmount, currencyCode)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-border bg-muted/10 p-4">
                <DeferredLink href={href} className={`${buttonPrimaryClassName} w-full gap-2`} aria-label={`View unit ${unit.houseNo}`}>
                  View unit <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </DeferredLink>
                <div className="flex flex-wrap items-center gap-2">
                  {orgRole && ["ADMIN", "MANAGER"].includes(orgRole) ? (
                    <DeferredLink href={`${href}?edit=1#unit-profile-edit`} className={`${buttonSecondaryClassName} min-w-0 flex-1 gap-2 px-3 text-xs`} aria-label={`Edit particulars for unit ${unit.houseNo}`}>
                      <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Edit particulars
                    </DeferredLink>
                  ) : null}
                  <form action={deleteUnitAction} className="min-w-0 flex-1">
                    <input type="hidden" name="unitId" value={unit.id} />
                    <button data-workspace-action="true" data-action-kind="destructive" type="submit" aria-label={`Delete unit ${unit.houseNo}`} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Delete
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
