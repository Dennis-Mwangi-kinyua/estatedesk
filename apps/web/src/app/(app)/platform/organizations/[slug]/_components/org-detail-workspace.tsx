import { OrganizationFeatureControls } from "./organization-feature-controls";
import type { getOrganizationDetailData } from "../_lib/queries";
import { OrgDetailActivitySection } from "./org-detail-activity-section";
import { OrgDetailOverviewSection } from "./org-detail-overview-section";
import Link from "@/components/navigation/workspace-link";

export type OrgDetailWorkspaceProps = Awaited<ReturnType<typeof getOrganizationDetailData>>;

export function OrgDetailWorkspace(props: OrgDetailWorkspaceProps) {
  if (props.org.deletedAt) {
    const { org, recentMembers, recentPayments } = props;
    const purgeDate = new Date(org.deletedAt!.getTime() + 30 * 86400000);
    return <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link href="/platform/organizations/deleted" className="inline-flex min-h-11 items-center text-sm font-semibold">← Deleted organizations</Link>
      <h1 className="break-words text-2xl font-semibold">{org.name}</h1>
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        Deleted {org.deletedAt!.toISOString().slice(0, 10)}. Read-only records for platform admins.
        {org.auditLogs.length ? `Eligible for permanent removal from ${purgeDate.toISOString().slice(0, 10)}.` : "Legacy deletion: automatic purge is not scheduled."} Organization access remains blocked.
      </div>
      <Link href={`/platform/organizations/${org.slug}/tenants`} className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold">Review tenant profiles, leases and payments</Link>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(org._count).map(([label, count]) => <div key={label} className="rounded-xl border border-border bg-card p-4"><dt className="break-words text-sm text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{count}</dd></div>)}</dl>
      <section className="rounded-2xl border border-border bg-card p-4"><h2 className="mb-3 font-semibold">Recent members</h2><ul className="divide-y divide-border">{recentMembers.map(member => <li key={member.id} className="break-words py-3 text-sm">{member.user.fullName} · {member.user.email ?? "No email"} · {member.role}</li>)}</ul></section>
      <section className="rounded-2xl border border-border bg-card p-4"><h2 className="mb-3 font-semibold">Recent payments</h2><ul className="divide-y divide-border">{recentPayments.map(payment => <li key={payment.id} className="break-words py-3 text-sm">{payment.payerTenant?.fullName ?? payment.payerUser?.fullName ?? "Payment"} · {org.currencyCode} {Number(payment.amount).toLocaleString()} · {payment.createdAt.toISOString().slice(0, 10)}</li>)}</ul></section>
    </div>;
  }
  return (
    <div className="organisation-detail-page mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      <OrgDetailOverviewSection {...props} />
      <div className="flex flex-wrap gap-3">
      <Link href={`/platform/organizations/${props.org.slug}/access`} className="inline-flex min-h-11 items-center rounded-xl border bg-card px-4 py-3 text-sm font-semibold">Manage organization role access</Link>
      <Link href={`/platform/organizations/${props.org.slug}/tenants`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">View tenants and individual records</Link>
      </div>
      <OrganizationFeatureControls orgId={props.org.id} orgName={props.org.name} features={props.org.settings?.features} />
      <OrgDetailActivitySection {...props} />
    </div>
  );
}
