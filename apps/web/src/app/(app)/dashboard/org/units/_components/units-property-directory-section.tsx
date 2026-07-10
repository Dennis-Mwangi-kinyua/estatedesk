import { Building2, ChevronRight } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { buildPageHref } from "../_lib/helpers";
import type { UnitsPageData } from "../_lib/types";
import { InlineMixStats, panelShellClassName } from "./units-ui";

export function UnitsPropertyDirectorySection({
  data,
}: {
  data: Extract<UnitsPageData, { view: "properties" }>;
}) {
  const { propertyDirectory, q, status, activity } = data;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Properties
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Open a property to review unit mixes such as apartments, bedsitters, and
          shops before drilling into individual units.
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {propertyDirectory.map((item) => (
          <DeferredLink
            key={item.property.id}
            href={buildPageHref({
              property: item.property.id,
              q: q || undefined,
              status,
              activity,
            })}
            className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ring hover:bg-muted/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Property
                </div>
                <h3 className="mt-3 truncate text-lg font-semibold text-foreground group-hover:text-primary">
                  {item.property.name}
                </h3>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {item.property.location || item.property.address || "No location"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>

            <div className="mt-4 space-y-2 border-t border-border/70 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {item.mixCount} unit mix{item.mixCount === 1 ? "" : "es"}
              </p>
              <InlineMixStats
                totalUnits={item.totalUnits}
                occupiedUnits={item.occupiedUnits}
                vacantUnits={item.vacantUnits}
              />
            </div>
          </DeferredLink>
        ))}
      </div>
    </section>
  );
}