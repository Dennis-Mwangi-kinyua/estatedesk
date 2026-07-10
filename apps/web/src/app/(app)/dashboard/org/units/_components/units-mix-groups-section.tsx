import { ChevronRight, Layers3 } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { buildPageHref } from "../_lib/helpers";
import type { UnitsPageData } from "../_lib/types";
import {
  InlineMixStats,
  MixActionLink,
  panelShellClassName,
} from "./units-ui";

export function UnitsMixGroupsSection({
  data,
}: {
  data: Extract<UnitsPageData, { view: "mixes" }>;
}) {
  const { selectedProperty, unitMixGroups, q, status, activity } = data;

  if (!selectedProperty) return null;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border bg-muted/10 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {selectedProperty.name}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          Unit mixes
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Choose an apartment type or unit category to review occupied and vacant
          inventory.
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {unitMixGroups.map((group) => {
          const baseHref = buildPageHref({
            property: selectedProperty.id,
            mix: group.key,
            q: q || undefined,
            status,
            activity,
          });
          const occupiedHref = buildPageHref({
            property: selectedProperty.id,
            mix: group.key,
            q: q || undefined,
            status: "OCCUPIED",
            activity,
          });
          const vacantHref = buildPageHref({
            property: selectedProperty.id,
            mix: group.key,
            q: q || undefined,
            status: "VACANT",
            activity,
          });

          return (
            <article
              key={group.key}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-ring hover:shadow-md"
            >
              <DeferredLink
                href={baseHref}
                className="group block p-5 transition hover:bg-muted/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <Layers3 className="h-3.5 w-3.5 shrink-0" />
                      Unit mix
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-snug text-foreground group-hover:text-primary sm:text-lg">
                      {group.label}
                    </h3>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>

                <div className="mt-4 border-t border-border/70 pt-4">
                  <InlineMixStats
                    totalUnits={group.totalUnits}
                    occupiedUnits={group.occupiedUnits}
                    vacantUnits={group.vacantUnits}
                  />
                </div>
              </DeferredLink>

              <div className="flex gap-2 border-t border-border bg-muted/5 px-4 py-3">
                <MixActionLink
                  href={occupiedHref}
                  label="Occupied"
                  count={group.occupiedUnits}
                  tone="success"
                />
                <MixActionLink
                  href={vacantHref}
                  label="Vacant"
                  count={group.vacantUnits}
                  tone="warning"
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}