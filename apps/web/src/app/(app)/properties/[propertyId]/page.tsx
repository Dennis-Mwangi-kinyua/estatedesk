import { redirect } from "next/navigation";

export default async function PropertyAliasPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  redirect(`/dashboard/org/properties/${propertyId}`);
}