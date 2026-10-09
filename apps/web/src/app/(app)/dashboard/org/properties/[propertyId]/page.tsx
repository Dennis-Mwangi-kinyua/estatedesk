import { notFound } from "next/navigation";
import { getPropertyDetails } from "@/features/properties/queries/get-property-details";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { PropertyDetailsWorkspace } from "./_components/property-details-workspace";
import { decodePublicId } from "@/lib/public-id";

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
  const property = await getPropertyDetails(decodePublicId(propertyId, "property"), session.activeOrgId!);

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
