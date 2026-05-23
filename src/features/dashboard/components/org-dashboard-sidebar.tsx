import {
  ArrowRight,
  Bell,
  CircleAlert,
  CreditCard,
  CheckCircle2,
  Banknote,
  Home,
  Users,
} from "lucide-react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import {
  HeroAction,
  MiniStat,
  SectionCard,
  SnapshotRow,
} from "./org-dashboard-shared";

const SIDEBAR_ACTIONS = [
  {
    href: "/dashboard/org/units",
    title: "Manage units",
    description: "Update vacancies, occupancy, and apartment status.",
    icon: Home,
  },
  {
    href: "/dashboard/org/payments",
    title: "Review M-Pesa payments",
    description: "Check STK collections, pending confirmations, and payment flow.",
    icon: Banknote,
  },
  {
    href: "/dashboard/org/tenants/new",
    title: "Add tenant",
    description: "Create a tenant profile and attach the right details quickly.",
    icon: Users,
  },
  {
    href: "/dashboard/org/issues",
    title: "Handle issues",
    description: "Follow up urgent repairs and operational incidents.",
    icon: CircleAlert,
  },
] as const;

export function OrgDashboardSidebar({
  data,
  membership,
}: {
  data: OrgDashboardSummary;
  membership: {
    org: {
      currencyCode: string;
      timezone: string;
      slug: string;
    };
  };
}) {
  const snapshotItems = [
    {
      icon: Bell,
      label: "Unread notifications",
      value: data.unreadNotifications,
      tone: "neutral" as const,
    },
    {
      icon: CircleAlert,
      label: "Urgent issues",
      value: data.urgentIssues,
      tone: "red" as const,
    },
    {
      icon: CreditCard,
      label: "Pending payments",
      value: data.pendingPayments,
      tone: "amber" as const,
    },
    {
      icon: CheckCircle2,
      label: "Active leases",
      value: data.activeLeases,
      tone: "green" as const,
    },
  ] as const;

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">Quick actions</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Common organization workflows in one place.
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {SIDEBAR_ACTIONS.map((item) => (
              <HeroAction
                key={item.title}
                href={item.href}
                title={item.title}
                description={item.description}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Operations snapshot</h2>
          <p className="mt-1 text-sm text-neutral-500">Items needing attention right now.</p>

          <div className="mt-4 space-y-3">
            {snapshotItems.map((item) => (
              <SnapshotRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                tone={item.tone}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Organization context</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Useful metadata for billing, reporting, and operations.
          </p>

          <div className="mt-4 grid gap-3">
            <MiniStat
              label="Currency"
              value={membership.org.currencyCode}
              helper="Base organization currency"
            />
            <MiniStat
              label="Timezone"
              value={membership.org.timezone}
              helper="Scheduling and reporting timezone"
            />
            <MiniStat
              label="Org slug"
              value={membership.org.slug}
              helper="Internal organization reference"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}