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
    <section className={`${panelShellClassName} p-3.5 sm:p-5 lg:p-6`}>
      <form className="space-y-3">
        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label htmlFor="tenant-directory-search" className="sr-only">Search tenants</label>
          <input
            id="tenant-directory-search"
            type="text"
            name="search"
            defaultValue={data.search}
            placeholder="Search tenant, phone, property, apartment, unit, location, or caretaker"
            className={`${fieldClassName} min-w-0`}
          />

          <input type="hidden" name="status" value={data.status} />
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="pageSize" value={data.pageSize} />
          {data.created ? <input type="hidden" name="created" value="1" /> : null}

          <button data-workspace-action="true" type="submit" className={`${buttonPrimaryClassName} w-full sm:w-auto`}>
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = data.status === option;

            return (
              <DeferredLink data-workspace-action="true"
                key={option}
                href={buildFilterHref({
                  search: data.search,
                  status: option,
                  created: data.created,
                  pageSize: data.pageSize,
                })}
                className={[
                  "inline-flex min-h-10 max-w-full items-center justify-center rounded-full border px-3 py-2 text-center text-xs font-medium leading-4 transition sm:px-4 sm:text-sm",
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
