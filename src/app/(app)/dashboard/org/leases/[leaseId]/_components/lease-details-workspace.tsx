import type { OrgRole } from "@prisma/client";
import type { LeaseDetailsData } from "../_lib/types";
import { LeaseDetailsGuidance } from "./lease-details-guidance";
import { LeaseDetailsHeader } from "./lease-details-header";
import { LeaseDetailsStats } from "./lease-details-stats";
import { LeaseNoticesPanel } from "./lease-notices-panel";
import { LeaseOverviewPanels } from "./lease-overview-panels";
import { LeaseRentChargesPanel } from "./lease-rent-charges-panel";
import { LeaseSecondaryPanels } from "./lease-secondary-panels";
import { LeaseTaxChargesPanel } from "./lease-tax-charges-panel";

export function LeaseDetailsWorkspace({
  data,
  orgRole,
}: {
  data: LeaseDetailsData;
  orgRole?: OrgRole | null;
}) {
  const {
    lease,
    currencyCode,
    totalRentCharges,
    totalRentPaid,
    totalRentBalance,
    totalTaxCharges,
  } = data;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <LeaseDetailsHeader lease={lease} />
      <LeaseDetailsStats lease={lease} currencyCode={currencyCode} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <LeaseOverviewPanels lease={lease} />
          <LeaseSecondaryPanels
            lease={lease}
            currencyCode={currencyCode}
            totalRentCharges={totalRentCharges}
            totalRentPaid={totalRentPaid}
            totalRentBalance={totalRentBalance}
            totalTaxCharges={totalTaxCharges}
          />
          <LeaseRentChargesPanel lease={lease} currencyCode={currencyCode} />
          <LeaseTaxChargesPanel lease={lease} currencyCode={currencyCode} />
          <LeaseNoticesPanel lease={lease} />
        </div>

        <LeaseDetailsGuidance orgRole={orgRole} tenantId={lease.tenant.id} />
      </div>
    </div>
  );
}