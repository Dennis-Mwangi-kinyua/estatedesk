import { ChevronRight } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { buildPageHref } from "../_lib/helpers";
import type { UnitsPageData } from "../_lib/types";

export function UnitsBreadcrumb({ data }: { data: UnitsPageData }) {
  const { view, q, status, activity } = data;

  if (view === "properties") {
    return null;
  }

  const selectedProperty = data.selectedProperty;
  const selectedMix = view === "units" ? data.selectedMix : null;

  return (
    <nav
      aria-label="Units navigation"
      className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
    >
      <DeferredLink
        href={buildPageHref({ q: q || undefined, status, activity })}
        className="font-medium text-foreground transition hover:text-primary"
      >
        All properties
      </DeferredLink>

      {selectedProperty ? (
        <>
          <ChevronRight className="h-4 w-4" />
          {view === "mixes" ? (
            <span className="font-medium text-foreground">
              {selectedProperty.name}
            </span>
          ) : (
            <DeferredLink
              href={buildPageHref({
                property: selectedProperty.id,
                q: q || undefined,
                status,
                activity,
              })}
              className="font-medium text-foreground transition hover:text-primary"
            >
              {selectedProperty.name}
            </DeferredLink>
          )}
        </>
      ) : null}

      {view === "units" && selectedMix ? (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">{selectedMix.label}</span>
        </>
      ) : null}
    </nav>
  );
}