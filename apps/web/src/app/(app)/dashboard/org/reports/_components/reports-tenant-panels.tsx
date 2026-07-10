import type { OrgRole } from "@prisma/client";
import type { ReportsPageData } from "../_lib/types";
import { TenantReportCard } from "./reports-ui";

export function ReportsTenantPanels({
  data,
  orgRole,
}: {
  data: ReportsPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <TenantReportCard
        title="Paid tenants"
        description="Tenants whose current-period obligations are fully settled."
        emptyText="No tenants are fully paid yet."
        rows={data.paidRows}
        showRentGuideWhenEmpty
        orgRole={orgRole}
      />
      <TenantReportCard
        title="Not fully paid"
        description="Tenants with partial, unpaid, overdue, or defaulted balances."
        emptyText="No open balances for this period."
        rows={data.notPaidRows}
        showRentGuideWhenEmpty
        orgRole={orgRole}
      />
    </section>
  );
}