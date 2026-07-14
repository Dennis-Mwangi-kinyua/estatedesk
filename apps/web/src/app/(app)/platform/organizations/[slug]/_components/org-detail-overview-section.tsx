import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  FileText,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  archiveOrganizationAction,
  permanentlyDeleteOrganizationAction,
} from "../actions";
import {
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatCurrency,
  formatDateTime,
  formatNumber,
  labelize,
  toneForStatus,
} from "../../../_components/control-plane";
import { formatSubscriptionSummary } from "../../../_lib/helpers";
import { formatDate } from "../_lib/helpers";
import type { OrgDetailWorkspaceProps } from "./org-detail-workspace";
import { InfoTile, SmallCount } from "./org-detail-ui";

export function OrgDetailOverviewSection(props: OrgDetailWorkspaceProps) {
  const { org, featureKeys, paidTotal, unitCount, recentMessages } = props;
  const billing = formatSubscriptionSummary(org.subscription);

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link
          href="/platform/organizations"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Organizations
        </Link>

        <PageHeader
          eyebrow="Organization control"
          title={org.name}
          description="Workspace health, billing, membership, payments, feature configuration, integrations, and recent activity in one platform administration view."
          action={
            <div className="platform-action-group">
              <Link
                href="/platform/payment-ops"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <Receipt className="h-4 w-4" />
                Payment ops
              </Link>
              <Link
                href="/platform/audit-logs"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                <ShieldCheck className="h-4 w-4" />
                Audit logs
              </Link>
            </div>
          }
        />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value={org.status} note={`Created ${formatDate(org.createdAt)}`} />
        <StatCard label="Tenants" value={formatNumber(org._count.tenants)} note={`${formatNumber(org._count.leases)} leases`} />
        <StatCard label="Properties" value={formatNumber(org._count.properties)} note={`${formatNumber(unitCount)} units`} />
        <StatCard label="Recognized paid" value={formatCurrency(paidTotal)} note={`${formatNumber(org._count.payments)} payments`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Surface title="Workspace profile">
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <InfoTile icon={<Building2 className="h-4 w-4" />} label="Slug" value={`/${org.slug}`} />
            <InfoTile icon={<Settings className="h-4 w-4" />} label="Timezone" value={org.timezone} />
            <InfoTile icon={<CreditCard className="h-4 w-4" />} label="Currency" value={org.currencyCode} />
            <InfoTile icon={<FileText className="h-4 w-4" />} label="Retention" value={`${org.dataRetentionDays} days`} />
            <InfoTile icon={<Users className="h-4 w-4" />} label="Email" value={org.email ?? "-"} />
            <InfoTile icon={<Users className="h-4 w-4" />} label="Phone" value={org.phone ?? "-"} />
          </div>
        </Surface>

        <Surface title="Billing and subscription">
          <div className="p-4">
            {org.subscription ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Badge tone={billing.tone}>{billing.label}</Badge>
                  {billing.detail ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {billing.detail}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Period start" value={formatDate(org.subscription.currentPeriodStart)} />
                  <InfoTile label="Period end" value={formatDate(org.subscription.currentPeriodEnd)} />
                  <InfoTile label="Trial end" value={formatDate(org.subscription.trialEndsAt)} />
                  <InfoTile label="Billing email" value={org.subscription.billingEmail ?? "-"} />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
                No subscription is linked to this organization.
              </div>
            )}
          </div>
        </Surface>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Surface title="Feature flags">
          <div className="p-4">
            {featureKeys.length ? (
              <div className="flex flex-wrap gap-2">
                {featureKeys.map((key) => (
                  <Badge key={key}>{key}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No feature flags configured.</p>
            )}
          </div>
        </Surface>

        <Surface title="KRA integration">
          <div className="space-y-3 p-4">
            {org.kraIntegration ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={toneForStatus(org.kraIntegration.status)}>
                    {org.kraIntegration.status}
                  </Badge>
                  <Badge>{org.kraIntegration.environment}</Badge>
                  <Badge>{org.kraIntegration.filingMode}</Badge>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Last sync: {formatDateTime(org.kraIntegration.lastSyncAt)}
                </p>
                {org.kraIntegration.lastError ? (
                  <p className="break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100">
                    {org.kraIntegration.lastError}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No KRA integration configured.</p>
            )}
          </div>
        </Surface>

        <Surface title="Operational counts">
          <div className="grid grid-cols-2 gap-3 p-4">
            <SmallCount label="Members" value={org._count.memberships} />
            <SmallCount label="API keys" value={org._count.apiKeys} />
            <SmallCount label="Issues" value={org._count.issues} />
            <SmallCount label="Messages" value={recentMessages.length} />
            <SmallCount label="Notifications" value={org._count.notifications} />
            <SmallCount label="Assets" value={org._count.assets} />
          </div>
        </Surface>
      </section>
    </>
  );
}
