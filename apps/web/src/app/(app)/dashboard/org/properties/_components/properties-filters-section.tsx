import { DeferredLink } from "@/components/navigation/app-links";
import { Search } from "lucide-react";
import type { PropertiesPageData } from "../_lib/types";
import { PROPERTY_TYPES, STATUS_OPTIONS } from "../_lib/types";
import { buildPageHref } from "../_lib/helpers";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  panelShellClassName,
} from "./properties-ui";

export function PropertiesFiltersSection({ data }: { data: PropertiesPageData }) {
  const { created, query, type, status, hasFilters } = data;

  const clearFiltersHref = buildPageHref({
    page: 1,
    created: created ? "1" : undefined,
  });

  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <form
        method="get"
        className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
      >
        {created ? <input type="hidden" name="created" value="1" /> : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Search</span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <input
              name="q"
              defaultValue={query}
              type="search"
              placeholder="Search by name, location, address, notes, PIN..."
              className={`${fieldClassName} pl-11`}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Type</span>
          <select name="type" defaultValue={type} className={fieldClassName}>
            <option value="all">All types</option>
            {PROPERTY_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Status</span>
          <select name="status" defaultValue={status} className={fieldClassName}>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3">
          <button type="submit" className={`${buttonPrimaryClassName} w-full lg:w-auto`}>
            Apply
          </button>
          {hasFilters ? (
            <DeferredLink href={clearFiltersHref} className={buttonSecondaryClassName}>
              Clear
            </DeferredLink>
          ) : null}
        </div>
      </form>
    </section>
  );
}