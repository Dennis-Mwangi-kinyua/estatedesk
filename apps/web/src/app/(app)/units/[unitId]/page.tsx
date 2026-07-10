import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    unitId: string;
  }>;
};

export default async function LegacyUnitRedirectPage({ params }: PageProps) {
  const { unitId } = await params;
  redirect(`/dashboard/org/units/${unitId}`);
}