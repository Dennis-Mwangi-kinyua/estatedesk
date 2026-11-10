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
        title="Paid tenants on this page"
        description="Tenants on the current page whose obligations are fully settled."
        emptyText="No fully paid tenants on this page."
        rows={data.paidRows}
        showRentGuideWhenEmpty
        orgRole={orgRole}
      />
      <TenantReportCard
        title="Not fully paid on this page"
        description="Tenants on the current page with partial, unpaid, overdue, or defaulted balances."
        emptyText="No open balances on this page."
        rows={data.notPaidRows}
        showRentGuideWhenEmpty
        orgRole={orgRole}
      />
    </section>
  );
}
