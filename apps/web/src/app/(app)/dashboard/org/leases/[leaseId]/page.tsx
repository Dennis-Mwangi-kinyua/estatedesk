import { requireManagementAccess } from "@/lib/permissions/guards";
import { loadLeaseDetailsData } from "./_lib/queries";
import type { LeasePageProps } from "./_lib/types";
import { LeaseDetailsWorkspace } from "./_components/lease-details-workspace";

export const dynamic = "force-dynamic";

export default async function LeaseDetailPage({ params }: LeasePageProps) {
  const session = await requireManagementAccess();
  const { leaseId } = await params;
  const data = await loadLeaseDetailsData(session.activeOrgId!, leaseId);

  return <LeaseDetailsWorkspace data={data} orgRole={session.activeOrgRole} />;
}