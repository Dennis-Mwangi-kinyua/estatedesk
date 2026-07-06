import type { PropertiesPageData } from "../_lib/types";
import { PropertiesEmptyState } from "./properties-empty-state";
import { PropertiesItemsSection } from "./properties-items-section";
import { PropertiesPaginationSection } from "./properties-pagination-section";
import { panelShellClassName } from "./properties-ui";

export function PropertiesDirectorySection({ data }: { data: PropertiesPageData }) {
  const { properties, overallProperties, inactiveProperties } = data;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          All properties
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {overallProperties} {overallProperties === 1 ? "property" : "properties"} in
          this organization
          {inactiveProperties > 0 ? `, including ${inactiveProperties} inactive` : ""}.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Showing {data.showingFrom}–{data.showingTo} of {data.filteredTotal} matching{" "}
          {data.filteredTotal === 1 ? "property" : "properties"}. Page {data.safeCurrentPage}{" "}
          of {data.totalPages}.
        </p>
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