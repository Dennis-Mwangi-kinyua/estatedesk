import type { OrgRole } from "@prisma/client";
import { PropertyDetailsView } from "@/features/properties/components/property-details-view";
import type { PropertyDetails } from "@/features/properties/queries/get-property-details";
import { InstallQrPanel } from "@/components/pwa/install-qr-panel";
import { PropertiesGuidance } from "../../_components/properties-guidance";

export function PropertyDetailsWorkspace({
  property,
  orgRole,
}: {
  property: PropertyDetails;
  orgRole?: OrgRole | null;
}) {
  const entranceQrPath = `/vacancies?source=entrance-qr&property=${encodeURIComponent(property.id)}`;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PropertyDetailsView property={property} />
        <div className="space-y-5">
          <InstallQrPanel
            targetUrl={entranceQrPath}
            title="Entrance QR — tenant onboarding"
            description={`Laminate for ${property.name}. Scan opens vacancies / PWA install without an app store.`}
            size={180}
          />
          <PropertiesGuidance orgRole={orgRole} />
        </div>
      </div>
    </div>
  );
}