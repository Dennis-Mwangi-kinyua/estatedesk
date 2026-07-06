import { getPaidCount, getTotalPaid, tenantHasMovedOut } from "../_lib/helpers";
import type { VerifyTenantPageData } from "../_lib/types";
import { VerifyTenantIdentityHistorySection } from "./verify-tenant-identity-history-section";
import { VerifyTenantLeaseHistorySection } from "./verify-tenant-lease-history-section";
import { VerifyTenantResultHeader } from "./verify-tenant-result-header";
import { VerifyTenantResultSidebar } from "./verify-tenant-result-sidebar";

type TenantResult = VerifyTenantPageData["results"][number];

export function VerifyTenantResultCard({
  tenant,
  activeOrgId,
  search,
}: {
  tenant: TenantResult;
  activeOrgId: string;
  search: string;
}) {
  const isCurrentOrg = tenant.orgId === activeOrgId;
  const paidCount = getPaidCount(tenant);
  const totalPaid = getTotalPaid(tenant);
  const movedOut = tenantHasMovedOut(tenant);
  const transferRequest = tenant.transferRequests[0] ?? null;
  const linkedOrgRecords =
    tenant.identity?.tenants.filter(
      (record) => record.id !== tenant.id,
    ) ?? [];
  const identityHistory = tenant.identity?.historyRecords ?? [];

  return (
    <section
      className="overflow-hidden rounded-[32px] ed-theme-card border border-border bg-card shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
    >
      <VerifyTenantResultHeader
        tenant={tenant}
        activeOrgId={activeOrgId}
        search={search}
        isCurrentOrg={isCurrentOrg}
        movedOut={movedOut}
        transferRequest={transferRequest}
        totalPaid={totalPaid}
      />

      <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <VerifyTenantLeaseHistorySection tenant={tenant} />

        <VerifyTenantResultSidebar
          tenant={tenant}
          paidCount={paidCount}
          linkedOrgRecords={linkedOrgRecords}
        />
      </div>

      <VerifyTenantIdentityHistorySection identityHistory={identityHistory} />
    </section>
  );
}