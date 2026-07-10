import { DeferredLink } from "@/components/navigation/app-links";
import { getCaretakerUnitHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type {
  CaretakerUnitListItem,
  CaretakerUnitsPageSuccess,
} from "../_lib/types";

export function UnitsList({
  data,
}: {
  data: CaretakerUnitsPageSuccess;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Directory"
        title={
          data.query
            ? `Results for “${data.query}”`
            : "Assigned apartments"
        }
        action={
          <form className="w-full sm:w-auto" method="get">
            <input
              name="q"
              defaultValue={data.query}
              placeholder="Search house, tenant, property..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 sm:min-w-[260px]"
            />
          </form>
        }
      />

      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {data.units.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-sm text-muted-foreground">
            No units match your search in the current assignment scope.
          </div>
        ) : (
          data.units.map((unit: CaretakerUnitListItem) => {
            const tenantName =
              unit.leases[0]?.tenant.fullName ?? "No active tenant";
            const openIssues = unit.issues.length;

            return (
              <DeferredLink
                key={unit.id}
                href={getCaretakerUnitHref(unit.id)}
                className="group block rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      House {unit.houseNo}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {unit.property.name}
                      {unit.building?.name ? ` · ${unit.building.name}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tenantName}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                      {unit.status.toLowerCase()}
                    </span>
                    {openIssues > 0 ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        {openIssues} open issue{openIssues === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>
              </DeferredLink>
            );
          })
        )}
      </div>
    </section>
  );
}