import { requireManagementAccess } from "@/lib/permissions/guards";
import { downloadLeaseAgreement } from "@/lib/documents/lease-download";
import { decodePublicId } from "@/lib/public-id";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ leaseId: string }> }) {
  const session = await requireManagementAccess();
  const { leaseId: publicLeaseId } = await params;
  const leaseId = decodePublicId(publicLeaseId, "lease");
  return downloadLeaseAgreement(request, leaseId, session, true);
}
