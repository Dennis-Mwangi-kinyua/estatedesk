import { Filter } from "lucide-react";
import { PAYMENT_FILTERS, reportFilterHref } from "../_lib/helpers";
import type { ReportsPageData } from "../_lib/types";
import { ReportFilterLink } from "./reports-ui";

export function ReportsFiltersSection({ data }: { data: ReportsPageData }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
          <Filter className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Report filters</p>
          <p className="text-sm text-muted-foreground">
            Narrow the rent matrix by apartment and payment behavior.
          </p>
        </div>
      </div>

      <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Apartment
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ReportFilterLink
              href={reportFilterHref({
                apartment: "all",
                payment: data.selectedPayment,
                period: data.period,
              })}
              active={data.selectedApartment === "all"}
            >
              All apartments
            </ReportFilterLink>
            {data.apartmentOptions.map((apartment) => (
              <ReportFilterLink
                key={apartment}
                href={reportFilterHref({
                  apartment,
                  payment: data.selectedPayment,
                  period: data.period,
                })}
                active={data.selectedApartment === apartment}
              >
                {apartment}
              </ReportFilterLink>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Occupants
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PAYMENT_FILTERS.map((filter) => (
              <ReportFilterLink
                key={filter.value}
                href={reportFilterHref({
                  apartment: data.selectedApartment,
                  payment: filter.value,
                  period: data.period,
                })}
                active={data.selectedPayment === filter.value}
              >
                {filter.label}
              </ReportFilterLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}