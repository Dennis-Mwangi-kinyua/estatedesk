import { RecipientMessageShare } from "@/components/shared/recipient-message-share";
import { buildAllocationDraft } from "@/lib/notifications/recipient-message";
import { accountLoginUrl } from "@/lib/notifications/account-login-url";
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

  const lease = data.lease;
  const money = (amount: unknown) => new Intl.NumberFormat("en-KE", { style: "currency", currency: lease.org.currencyCode }).format(Number(amount));
  const draft = buildAllocationDraft({ fullName: lease.tenant.fullName, email: lease.tenant.user?.email ?? lease.tenant.email, phone: lease.tenant.user?.phone ?? lease.tenant.phone, workspace: lease.org.name, property: lease.unit.property.name, unit: lease.unit.houseNo, startDate: new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: "Africa/Nairobi" }).format(lease.startDate), monthlyRent: money(lease.monthlyRent), deposit: lease.deposit != null ? money(lease.deposit) : undefined, dueDay: lease.dueDay ?? undefined, loginUrl: accountLoginUrl() });
  return <div className="space-y-5"><LeaseDetailsWorkspace data={data} orgRole={session.activeOrgRole} agreement={<LeaseAgreementPanel leaseId={leaseId} />} />
    {lease.status === "ACTIVE" && <RecipientMessageShare draft={draft} title="Share unit allocation" />}
  </div>;
}
