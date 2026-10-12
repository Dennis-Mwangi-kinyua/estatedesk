import { OrgBillingActions } from "./org-billing-actions";
import { OrganizationNameEditor } from "@/components/forms/organization-name-editor";
import { renamePlatformOrganizationAction } from "@/features/organizations/actions/rename-organization";
import Link from "@/components/navigation/workspace-link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe2,
  CalendarDays,
  Building2,
  WalletCards as CreditCard,
  FileText,
  Receipt,
  Settings,
  ShieldCheck,
  UsersRound as Users,
} from "lucide-react";
import {
  Badge,
  formatCurrency,
  formatDateTime,
  formatNumber,
  toneForStatus,
} from "../../../_components/control-plane";
import { formatSubscriptionSummary } from "../../../_lib/helpers";
import { formatDate } from "../_lib/helpers";
import type { OrgDetailWorkspaceProps } from "./org-detail-workspace";
import { InfoTile, SmallCount, OrgSummaryCard, OrgSurface } from "./org-detail-ui";

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

        <header className="org-detail-hero overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-start gap-4">
                <span className="org-hero-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><Building2 aria-hidden="true" className="h-7 w-7" /></span>
                <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Organisation overview</p><h1 data-heading-icon="custom" className="mt-2 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{org.name}</h1><p className="mt-2 break-all text-sm text-muted-foreground">/{org.slug}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Globe2 aria-hidden="true" className="h-4 w-4" />{org.timezone}</span>
                <span className="inline-flex items-center gap-2"><CreditCard aria-hidden="true" className="h-4 w-4" />{org.currencyCode}</span>
                <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="h-4 w-4" />Created {formatDate(org.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:min-w-56">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/80 px-4 py-3"><span className="text-xs font-medium text-muted-foreground">Workspace status</span><Badge tone={toneForStatus(org.status)}>{org.status}</Badge></div>
              <Link data-workspace-action="true" href={`/platform/payment-ops?orgId=${encodeURIComponent(org.slug)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Receipt aria-hidden="true" className="h-4 w-4" />Payment operations</Link>
              <Link data-workspace-action="true" href="#organisation-audit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Audit activity</Link>
            </div>
          </div>
        </header>
      </div>

      <nav aria-label="Organisation sections" className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-2 sm:grid-cols-6 sm:p-3">{[{id:"profile",label:"Profile",Icon:Building2},{id:"billing",label:"Billing",Icon:CreditCard},{id:"operations",label:"Operations",Icon:Settings},{id:"payments",label:"Payments",Icon:Receipt},{id:"members",label:"Members",Icon:Users},{id:"audit",label:"Audit activity",Icon:ShieldCheck}].map(({id,label,Icon})=><Link key={id} href={`#organisation-${id}`} className="flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-center text-xs font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon aria-hidden="true" className="h-5 w-5 text-primary"/>{label}</Link>)}</nav>
      <section className="organisation-summary grid grid-cols-2 gap-3 xl:grid-cols-4">
        <OrgSummaryCard label="Status" value={org.status} note={`Created ${formatDate(org.createdAt)}`} />
        <OrgSummaryCard label="Tenants" value={formatNumber(org._count.tenants)} note={`${formatNumber(org._count.leases)} leases`} />
        <OrgSummaryCard label="Properties" value={formatNumber(org._count.properties)} note={`${formatNumber(unitCount)} units`} />
        <OrgSummaryCard label="Recognized paid" value={formatCurrency(paidTotal)} note={`${formatNumber(org._count.payments)} payments`} />
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-2">
        <OrgSurface id="organisation-profile" title="Workspace profile" description="Identity, contact details and workspace preferences." className="organisation-profile-card">
          <div className="p-4 sm:px-5"><OrganizationNameEditor name={org.name} orgId={org.id} action={renamePlatformOrganizationAction} /></div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <InfoTile icon={<Building2 className="h-4 w-4" />} label="Slug" value={`/${org.slug}`} />
            <InfoTile icon={<Settings className="h-4 w-4" />} label="Timezone" value={org.timezone} />
            <InfoTile icon={<CreditCard className="h-4 w-4" />} label="Currency" value={org.currencyCode} />
            <InfoTile icon={<FileText className="h-4 w-4" />} label="Retention" value={`${org.dataRetentionDays} days`} />
            <InfoTile icon={<Mail className="h-4 w-4" />} label="Email" value={org.email ?? "-"} />
            <InfoTile icon={<Phone className="h-4 w-4" />} label="Phone" value={org.phone ?? "-"} />
          </div>
        </OrgSurface>

        <OrgSurface id="organisation-billing" title="Billing and subscription" description="Subscription dates, invoices and renewal actions.">
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
                <OrgBillingActions orgId={org.id} cancelled={org.subscription.status === "CANCELLED"} />
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
                No subscription is linked to this organization.
              </div>
            )}
          </div>
        </OrgSurface>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-2">
        <OrgSurface title="Feature flags" description="Features enabled for this organisation.">
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
        </OrgSurface>

        <OrgSurface id="organisation-kra" title="KRA integration" description="Tax integration status and synchronization.">
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
        </OrgSurface>

      </section>

      <section aria-label="Organisation operational counts">
        <OrgSurface id="organisation-operations" title="Operational counts" description="A snapshot of people, records and activity across the workspace.">
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 xl:grid-cols-5">
            <SmallCount label="Members" value={org._count.memberships} />
            <SmallCount label="API keys" value={org._count.apiKeys} />
            <SmallCount label="Issues" value={org._count.issues} />
            <SmallCount label="Messages" value={recentMessages.length} />
            <SmallCount label="Notifications" value={org._count.notifications} />
            <SmallCount label="Assets" value={org._count.assets} />
            <SmallCount label="Water bills" value={org._count.waterBills} />
            <SmallCount label="Leases" value={org._count.leases} />
            <SmallCount label="Invitations" value={org._count.invitations} />
            <SmallCount label="Audit records" value={org._count.auditLogs} />
          </div>
        </OrgSurface>
      </section>
    </>
  );
}
