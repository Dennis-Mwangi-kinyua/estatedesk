import { ReinstatePanel } from "@/features/tenancy/reinstate-panel";
import { RecordOrgPayment } from "@/features/charges/components/record-org-payment";
import { InitialChargesPanel } from "@/features/charges/components/initial-charges-panel";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { requireUserSession } from "@/lib/auth/session";
import { loadTenantDetailsData } from "./_lib/queries";
import type { TenantDetailsPageProps } from "./_lib/types";
import { TenantDetailsWorkspace } from "./_components/tenant-details-workspace";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TenantDetailsPage({ params }: TenantDetailsPageProps) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No active organisation found for your account.
      </div>
    );
  }

  if (
    !session.activeOrgRole ||
    !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole)
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        You do not have permission to view tenant details.
      </div>
    );
  }

  const { tenantId } = await params;
  const data = await loadTenantDetailsData(
    String(session.activeOrgId).trim(),
    tenantId,
    session.activeOrgRole,
  );

  if (tenantId !== data.canonicalSlug) {
    redirect(`/dashboard/org/tenants/${encodeURIComponent(data.canonicalSlug)}`);
  }

  return <>{["ADMIN", "MANAGER", "OFFICE"].includes(session.activeOrgRole) && !data.hasActiveLease && !data.isDeleted && !data.isBlacklisted ? <ReinstatePanel tenantId={data.tenant.id} orgId={session.activeOrgId} /> : null}<TenantDetailsWorkspace data={data} orgRole={session.activeOrgRole} initialCharges={<>{memberHasOrgPermission(session, "payments.verify") ? <RecordOrgPayment orgId={session.activeOrgId} tenantId={data.tenant.id} /> : null}<InitialChargesPanel orgId={session.activeOrgId} tenantId={data.tenant.id} canConfirm={memberHasOrgPermission(session, "payments.verify")} /></>} /></>;
}
