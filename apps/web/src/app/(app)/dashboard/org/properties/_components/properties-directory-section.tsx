import type { PropertiesPageData } from "../_lib/types";
import { PropertiesEmptyState } from "./properties-empty-state";
import { PropertiesItemsSection } from "./properties-items-section";
import { PropertiesPaginationSection } from "./properties-pagination-section";

export function PropertiesDirectorySection({ data }: { data: PropertiesPageData }) {
  const { properties } = data;

  return (
    <section aria-labelledby="properties-directory-title" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div><h2 id="properties-directory-title" className="text-lg font-semibold text-foreground">{data.hasFilters ? "Matching properties" : "Property directory"}</h2><p className="mt-1 text-xs text-muted-foreground">Showing {data.showingFrom}–{data.showingTo} of {data.filteredTotal} properties</p></div>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">Newest first</span>
      </div>

      {properties.length === 0 ? (
        <PropertiesEmptyState data={data} />
      ) : (
        <>
          <PropertiesItemsSection data={data} />
          <div className="border-t border-border">
            <PropertiesPaginationSection data={data} />
          </div>
        </>
      )}
    </section>
  );
}