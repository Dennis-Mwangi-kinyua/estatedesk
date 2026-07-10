import { DeferredLink } from "@/components/navigation/app-links";
import { buildFilterHref, formatStatus } from "../_lib/helpers";
import { STATUS_OPTIONS, type TenantsPageData } from "../_lib/types";
import {
  buttonPrimaryClassName,
  fieldClassName,
  panelShellClassName,
} from "./tenants-ui";

export function TenantsFiltersSection({ data }: { data: TenantsPageData }) {
  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <form className="space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row">
          <input
            type="text"
            name="search"
            defaultValue={data.search}
            placeholder="Search tenant, phone, property, apartment, unit, location, or caretaker"
            className={fieldClassName}
          />

          <input type="hidden" name="status" value={data.status} />
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="pageSize" value={data.pageSize} />
          {data.created ? <input type="hidden" name="created" value="1" /> : null}

          <button type="submit" className={buttonPrimaryClassName}>
            Search
          </button>
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {STATUS_OPTIONS.map((option) => {
            const active = data.status === option;

            return (
              <DeferredLink
                key={option}
                href={buildFilterHref({
                  search: data.search,
                  status: option,
                  created: data.created,
                  pageSize: data.pageSize,
                })}
                className={[
                  "inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-muted/20 text-foreground hover:bg-muted/40",
                ].join(" ")}
              >
                {option === "ALL" ? "All" : formatStatus(option)}
              </DeferredLink>
            );
          })}
        </div>
      </form>
    </section>
  );
}