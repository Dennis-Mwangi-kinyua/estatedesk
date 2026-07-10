import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { buildUnitReadHref } from "../_lib/helpers";
import type { CaretakerMeterReadPageData } from "../_lib/types";

export function ReadPendingList({
  data,
}: {
  data: Extract<CaretakerMeterReadPageData, { ok: true }>;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Pending readings"
        title="Apartments without submitted readings"
        action={
          data.pendingUnits.length > 0 ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {data.pendingUnits.length} pending
            </span>
          ) : null
        }
      />

      <div className="p-4 sm:p-5">
        {data.pendingUnits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              All occupied apartments already have readings for {data.period}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {data.pendingUnits.map((unit) => (
              <Link
                key={unit.id}
                href={buildUnitReadHref(unit.publicId, data.period)}
                className="group block rounded-2xl border border-border bg-muted/10 p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/20 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {unit.propertyName} · {unit.buildingName ?? "No building"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {unit.tenantName}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    House {unit.houseNo}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Previous
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {unit.previousReading > 0 ? unit.previousReading : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Current
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">—</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Units used
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">—</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-amber-700 dark:text-amber-200">
                    Not yet submitted for approval
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                    Enter readings
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}