import { requireManagementAccess } from "@/lib/permissions/guards";
import { getUnitDetailsData } from "./_lib/queries";
import type { UnitDetailsPageProps } from "./_lib/types";
import { UnitDetailsWorkspace } from "./_components/unit-details-workspace";

export const dynamic = "force-dynamic";

export default async function UnitDetailsPage({ params }: UnitDetailsPageProps) {
  const session = await requireManagementAccess();
  const { unitId } = await params;
  const requestedUnitRef = decodeURIComponent(unitId);

  const data = await getUnitDetailsData(session.activeOrgId!, requestedUnitRef);

  return <UnitDetailsWorkspace data={data} orgRole={session.activeOrgRole} />;
}