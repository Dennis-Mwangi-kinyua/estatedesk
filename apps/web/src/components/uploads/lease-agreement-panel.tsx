import { scopedUnitWhere } from "@/lib/permissions/record-scope";
import { encodePublicId } from "@/lib/public-id";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { DEFAULT_LEASE_TERMS } from "@/lib/documents/lease-agreement-pdf";
import { LeaseAgreementForm } from "./lease-agreement-form";
export async function LeaseAgreementPanel({ leaseId }: { leaseId: string }) {
  const session = await requireManagementAccess();
  const lease = await prisma.lease.findFirst({ where: { id: leaseId, orgId: session.activeOrgId!, deletedAt: null, unit: scopedUnitWhere(session.activeOrgId!, session.membershipScope) }, include: { org: { select: { name: true } }, contractDocument: { select: { metadata: true } } } });
  if (!lease) return null;
  const template = !lease.contractDocumentId ? await prisma.asset.findFirst({
    where: { orgId: session.activeOrgId!, deletedAt: null, metadata: { path: ["isOrgTemplate"], equals: true }, assetType: "CONTRACT" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { metadata: true },
  }) : null;
  const metadata = (lease.contractDocument?.metadata ?? template?.metadata) as { title?: string; landlordName?: string; terms?: string; accentColor?: string; fontFamily?: "sans" | "serif"; footerText?: string } | null;
  return <LeaseAgreementForm publicLeaseId={encodePublicId(lease.id, "lease")} leaseId={lease.id} title={metadata?.title || "Tenancy lease agreement"} landlordName={metadata?.landlordName || lease.org.name} terms={metadata?.terms || DEFAULT_LEASE_TERMS} accentColor={metadata?.accentColor || "#0a6452"} fontFamily={metadata?.fontFamily || "sans"} footerText={metadata?.footerText || ""} hasContract={!!lease.contractDocumentId} canEdit={memberHasOrgPermission(session, "leases.manage")} />;
}
