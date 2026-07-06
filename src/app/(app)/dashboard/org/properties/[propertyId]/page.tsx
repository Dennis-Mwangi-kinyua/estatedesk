import { notFound } from "next/navigation";
import { getPropertyDetails } from "@/features/properties/queries/get-property-details";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { PropertyDetailsWorkspace } from "./_components/property-details-workspace";

type PropertyDetailsPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

export default async function PropertyDetailsPage({
  params,
}: PropertyDetailsPageProps) {
  const session = await requireManagementAccess();
  const { propertyId } = await params;
  const property = await getPropertyDetails(propertyId, session.activeOrgId!);

  if (!property) {
    notFound();
  }

  return (
    <PropertyDetailsWorkspace
      property={property}
      orgRole={session.activeOrgRole}
    />
  );
}
