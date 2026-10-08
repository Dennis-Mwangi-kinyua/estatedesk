import type { PropertyDetails } from "@/features/properties/queries/get-property-details";
import { PropertyDetailsOverview } from "./property-details-overview";
import { PropertyDetailsPortfolio } from "./property-details-portfolio";
import { PropertyDetailsUnitsIssues } from "./property-details-units-issues";

export function PropertyDetailsView({
  property, canRenameUnits = false,
}: {
  property: PropertyDetails;
  canRenameUnits?: boolean;
}) {
  return (
    <div className="space-y-8">
      <PropertyDetailsOverview property={property} />
      <PropertyDetailsPortfolio property={property} />
      <PropertyDetailsUnitsIssues property={property} canRenameUnits={canRenameUnits} />
    </div>
  );
}