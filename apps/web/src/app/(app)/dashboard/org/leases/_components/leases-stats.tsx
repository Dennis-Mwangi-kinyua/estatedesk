import { formatCurrency } from "../_lib/helpers";
import type { OrgLeasesPageData } from "../_lib/types";
import { StatCard } from "./leases-ui";

export function LeasesStats({ data }: { data: OrgLeasesPageData }) {
  const {
    totalLeases,
    activeLeases,
    pendingLeases,
    expiredLeases,
    terminatedLeases,
    totalMonthlyRent,
    currencyCode,
  } = data;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Total leases" value={totalLeases} />
      <StatCard
        label="Active"
        value={activeLeases}
        highlight={activeLeases > 0 ? "success" : "default"}
        note="Currently billing"
      />
      <StatCard
        label="Pending"
        value={pendingLeases}
        highlight={pendingLeases > 0 ? "warning" : "default"}
        note="Awaiting activation"
      />
      <StatCard label="Expired" value={expiredLeases} note="Ended by date" />
      <StatCard label="Terminated" value={terminatedLeases} note="Ended early" />
      <StatCard
        label="Monthly rent"
        value={formatCurrency(totalMonthlyRent, currencyCode)}
        note="Across all leases"
      />
    </section>
  );
}