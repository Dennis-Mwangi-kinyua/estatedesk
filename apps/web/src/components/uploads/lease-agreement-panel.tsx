import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { DEFAULT_LEASE_TERMS } from "@/lib/documents/lease-agreement-pdf";
import { LeaseAgreementForm } from "./lease-agreement-form";
export async function LeaseAgreementPanel({ leaseId }: { leaseId: string }) {
  const session = await requireManagementAccess();
  const lease = await prisma.lease.findFirst({ where: { id: leaseId, orgId: session.activeOrgId!, deletedAt: null }, include: { org: { select: { name: true } }, contractDocument: { select: { metadata: true } } } });
  if (!lease) return null;
  const metadata = lease.contractDocument?.metadata as { title?: string; landlordName?: string; terms?: string } | null;
  return <LeaseAgreementForm leaseId={lease.id} title={metadata?.title || "Tenancy lease agreement"} landlordName={metadata?.landlordName || lease.org.name} terms={metadata?.terms || DEFAULT_LEASE_TERMS} hasContract={!!lease.contractDocumentId} canEdit={roleHasOrgPermission(session.activeOrgRole, "leases.manage")} />;
}
