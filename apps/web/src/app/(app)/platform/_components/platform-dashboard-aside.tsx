import { formatNumber } from "../_lib/helpers";
import type { PlatformDashboardData } from "../_lib/queries";
import {
  MiniStat,
  Panel,
  ProgressRow,
} from "./platform-ui";

export function PlatformDashboardAside({
  data,
}: {
  data: PlatformDashboardData;
}) {
  const {
    totalRootAdmins,
    totalPlatformAdmins,
    totalSubscriptions,
    activeSubscriptions,
    trialSubscriptions,
    atRiskSubscriptions,
  } = data;

  return (
    <section aria-label="Platform operations" className="platform-operations-grid grid min-w-0 items-stretch gap-4 md:grid-cols-2">
      <Panel title="Platform health" subtitle="Core live totals">
        <div className="grid grid-cols-2 gap-2.5">
          <MiniStat label="Root admins" value={formatNumber(totalRootAdmins)} />
          <MiniStat label="Platform admins" value={formatNumber(totalPlatformAdmins)} />
          <MiniStat label="Tenants" value={formatNumber(data.totalTenants)} />
          <MiniStat label="Leases" value={formatNumber(data.totalLeases)} />
        </div>
      </Panel>

      <Panel title="Subscription mix" subtitle="Current billing status">
        <div className="space-y-3.5">
          <ProgressRow
            label="Active"
            value={activeSubscriptions}
            total={Math.max(totalSubscriptions, 1)}
            tone="bg-stone-900"
          />
          <ProgressRow
            label="Trialing"
            value={trialSubscriptions}
            total={Math.max(totalSubscriptions, 1)}
            tone="bg-stone-500"
          />
          <ProgressRow
            label="At risk"
            value={atRiskSubscriptions}
            total={Math.max(totalSubscriptions, 1)}
            tone="bg-stone-300"
          />
        </div>
      </Panel>
    </section>
  );
}
