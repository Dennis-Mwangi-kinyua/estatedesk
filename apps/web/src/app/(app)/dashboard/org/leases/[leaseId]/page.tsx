import { LeaseAgreementPanel } from "@/components/uploads/lease-agreement-panel";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { loadLeaseDetailsData } from "./_lib/queries";
import type { LeasePageProps } from "./_lib/types";
import { LeaseDetailsWorkspace } from "./_components/lease-details-workspace";
import { decodePublicId } from "@/lib/public-id";

export const dynamic = "force-dynamic";

export default async function LeaseDetailPage({ params }: LeasePageProps) {
  const session = await requireManagementAccess();
  const { leaseId: publicLeaseId } = await params;
  const leaseId = decodePublicId(publicLeaseId, "lease");
  const data = await loadLeaseDetailsData(session.activeOrgId!, leaseId);

  return <><LeaseDetailsWorkspace data={data} orgRole={session.activeOrgRole} /><div className="mx-auto max-w-7xl p-4"><LeaseAgreementPanel leaseId={leaseId} /></div></>;
}
