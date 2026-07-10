import { formatDate, formatMoney } from "../_lib/helpers";
import { isPdfLeaseAsset } from "../_lib/download";
import type { TenantLeasePageData } from "../_lib/types";
import { panelShellClassName, SummaryMetric } from "./leases-ui";

function sumOutstanding(
  leases: TenantLeasePageData["activeLeases"],
) {
  return leases.reduce((leaseTotal, lease) => {
    const chargeTotal = lease.rentCharges.reduce(
      (sum, charge) => sum + Number(charge.balance),
      0,
    );

    return leaseTotal + chargeTotal;
  }, 0);
}

export function LeaseStats({ data }: { data: TenantLeasePageData }) {
  const { activeLeases, latestLease } = data;
  const outstanding = sumOutstanding(activeLeases);
  const hasContract =
    latestLease?.contractDocument &&
    isPdfLeaseAsset(latestLease.contractDocument);

  return (
    <section className={`${panelShellClassName} grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6`}>
      <SummaryMetric
        label="Active leases"
        value={String(activeLeases.length)}
        note={
          activeLeases.length === 1
            ? "Current tenancy on file"
            : "Multiple active records"
        }
      />
      <SummaryMetric
        label="Outstanding balance"
        value={formatMoney(outstanding)}
        note="Across recent rent charges"
      />
      <SummaryMetric
        label="Monthly rent"
        value={latestLease ? formatMoney(latestLease.monthlyRent) : "—"}
        note={
          latestLease
            ? `Due on day ${latestLease.dueDay}`
            : "No active lease linked"
        }
      />
      <SummaryMetric
        label="Lease contract"
        value={hasContract ? "Available" : "Pending"}
        note={
          hasContract
            ? `Updated ${formatDate(latestLease?.contractDocument?.createdAt)}`
            : "PDF not uploaded yet"
        }
      />
    </section>
  );
}