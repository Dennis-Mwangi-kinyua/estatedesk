import {
  CreditCard,
  FileClock,
  Plus,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { formatNumber } from "../_lib/helpers";
import type { PlatformDashboardData } from "../_lib/queries";
import {
  ActionLink,
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
    totalProperties,
    totalUnits,
    totalSubscriptions,
    activeSubscriptions,
    trialSubscriptions,
    atRiskSubscriptions,
  } = data;

  return (
    <aside className="flex flex-col gap-5">
      <Panel title="Quick actions" subtitle="High-priority shortcuts">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
          <ActionLink href="/platform/organizations/new" label="New organization" icon={Plus} />
          <ActionLink href="/platform/onboarding?status=NEW" label="New onboarding" icon={SlidersHorizontal} />
          <ActionLink href="/platform/users" label="Platform users" icon={Users} />
          <ActionLink href="/platform/billing" label="Billing center" icon={CreditCard} />
          <ActionLink href="/platform/audit-logs" label="Audit logs" icon={FileClock} />
        </div>
      </Panel>

      <Panel title="Platform health" subtitle="Core live totals">
        <div className="grid grid-cols-2 gap-2.5">
          <MiniStat label="Root admins" value={formatNumber(totalRootAdmins)} />
          <MiniStat label="Platform admins" value={formatNumber(totalPlatformAdmins)} />
          <MiniStat label="Properties" value={formatNumber(totalProperties)} />
          <MiniStat label="Units" value={formatNumber(totalUnits)} />
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
    </aside>
  );
}