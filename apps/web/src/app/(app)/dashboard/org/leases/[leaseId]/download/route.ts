import { requireManagementAccess } from "@/lib/permissions/guards";
import { downloadLeaseAgreement } from "@/lib/documents/lease-download";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ leaseId: string }> }) {
  const session = await requireManagementAccess();
  const { leaseId } = await params;
  return downloadLeaseAgreement(request, leaseId, session, true);
}
