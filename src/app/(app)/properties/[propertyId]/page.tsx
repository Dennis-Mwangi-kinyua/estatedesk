import { notFound } from "next/navigation";
import { PropertyDetailsView } from "@/features/properties/components/property-details-view";
import { getPropertyDetails } from "@/features/properties/queries/get-property-details";

type PropertyDetailsPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

export default async function PropertyDetailsPage({
  params,
}: PropertyDetailsPageProps) {
  const { propertyId } = await params;
  const property = await getPropertyDetails(propertyId);

  if (!property) {
    notFound();
  }

  return <PropertyDetailsView property={property} />;
}