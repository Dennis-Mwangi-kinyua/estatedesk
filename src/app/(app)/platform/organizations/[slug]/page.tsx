import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { archiveOrganizationAction, permanentlyDeleteOrganizationAction } from "./actions";
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
} from "../../_components/control-plane";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    deleteError?: string;
    archiveError?: string;
  }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function jsonKeys(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.keys(value as Record<string, unknown>);
}

export default async function PlatformOrganizationDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const { slug } = await params;
  const statusParams = await searchParams;

  const org = await prisma.organization.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      deletedAt: null,
    },
    include: {
      subscription: {
        include: {
          planChanges: {
            orderBy: { effectiveFrom: "desc" },
            take: 3,
          },
        },
      },
      settings: true,
      kraIntegration: true,
      _count: {
        select: {
          apiKeys: true,
          assets: true,
          auditLogs: true,
          invitations: true,
          issues: true,
          leases: true,
          memberships: true,
          notifications: true,
          payments: true,
          properties: true,
          tenants: true,
          waterBills: true,
        },
      },
    },
  });

  if (!org) {
    notFound();
  }

  if (slug !== org.slug) {
    redirect(`/platform/organizations/${org.slug}`);
  }

  const [
    paymentTotal,
    unitCount,
    recentPayments,
    recentMembers,
    recentAuditLogs,
    recentMessages,
  ] =
    await Promise.all([
      prisma.payment.aggregate({
        where: {
          orgId: org.id,
          OR: [
            { gatewayStatus: "SUCCESS" },
            { verificationStatus: "VERIFIED" },
            { verificationStatus: "NOT_REQUIRED" },
          ],
        },
        _sum: { amount: true },
      }),
      prisma.unit.count({
        where: {
          deletedAt: null,
          property: {
            orgId: org.id,
          },
        },
      }),
      prisma.payment.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          payerTenant: { select: { fullName: true } },
          payerUser: { select: { fullName: true } },
        },
      }),
      prisma.membership.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              status: true,
              lastLoginAt: true,
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          actor: { select: { fullName: true, email: true } },
        },
      }),
      prisma.platformMessage.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          sender: { select: { fullName: true, email: true } },
        },
      }),
    ]);

  const featureKeys = jsonKeys(org.settings?.features);
  const paidTotal = Number(paymentTotal._sum.amount ?? 0);

  return (
    <div className="space-y-6">
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
            <div className="flex flex-wrap gap-2">
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
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{org.subscription.plan}</Badge>
                  <Badge tone={toneForStatus(org.subscription.status)}>
                    {org.subscription.status}
                  </Badge>
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
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100">
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

      <section className="grid gap-4 xl:grid-cols-2">
        <Surface title="Recent payments">
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950 dark:text-white">
                    {payment.payerTenant?.fullName ??
                      payment.payerUser?.fullName ??
                      payment.payerName ??
                      payment.payerType}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {payment.targetType} • {payment.reference ?? payment.externalReference ?? "-"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {formatCurrency(Number(payment.amount))}
                  </p>
                  <Badge tone={toneForStatus(payment.gatewayStatus)}>
                    {payment.gatewayStatus}
                  </Badge>
                </div>
              </div>
            ))}
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No payments found.</div>
            ) : null}
          </div>
        </Surface>

        <Surface title="Recent members">
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {recentMembers.map((member) => (
              <div key={member.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950 dark:text-white">
                    {member.user.fullName}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                    {member.user.email ?? "-"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge>{member.role}</Badge>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(member.user.lastLoginAt)}
                  </p>
                </div>
              </div>
            ))}
            {recentMembers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No members found.</div>
            ) : null}
          </div>
        </Surface>
      </section>

      <Surface title="Recent audit activity">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {recentAuditLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-950 dark:text-white">{log.actor.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{log.actor.email ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{labelize(log.action)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {log.entityType} / {log.entityId}
                  </td>
                </tr>
              ))}
              {recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No audit activity found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface
        title="Danger zone"
        description="Archive access or permanently remove this organization."
      >
        <form action={archiveOrganizationAction} className="space-y-4 border-b border-slate-200 p-4 dark:border-white/10">
          <input type="hidden" name="orgId" value={org.id} />
          <input type="hidden" name="expectedSlug" value={org.slug} />
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            Archive keeps the organization data but terminates service access. Users in
            <span className="font-semibold"> {org.name}</span> will be directed to a service termination page when they try to log in.
          </div>
          {statusParams?.archiveError ? (
            <p className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
              {statusParams.archiveError}
            </p>
          ) : null}
          <label className="block max-w-md">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Type {org.slug} to archive
            </span>
            <input
              name="archiveConfirmation"
              autoComplete="off"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-amber-400 dark:focus:ring-amber-400/20"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 dark:hover:bg-amber-400/20 dark:focus-visible:ring-offset-slate-900"
          >
            Archive and terminate access
          </button>
        </form>

        <form action={permanentlyDeleteOrganizationAction} className="space-y-4 p-4">
          <input type="hidden" name="orgId" value={org.id} />
          <input type="hidden" name="expectedSlug" value={org.slug} />
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100">
            This action deletes properties, units, tenants, leases, payments, water bills,
            notifications, messages, invitations, assets, settings, and audit records owned by
            <span className="font-semibold"> {org.name}</span>. It cannot be undone.
          </div>
          {statusParams?.deleteError ? (
            <p className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100">
              {statusParams.deleteError}
            </p>
          ) : null}
          <label className="block max-w-md">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Type {org.slug} to confirm
            </span>
            <input
              name="confirmation"
              autoComplete="off"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:border-red-400 dark:focus:ring-red-400/20"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-red-500 dark:text-white dark:hover:bg-red-400 dark:focus-visible:ring-offset-slate-900"
          >
            Permanently delete organization
          </button>
        </form>
      </Surface>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon ? <span className="text-slate-400 dark:text-slate-500">{icon}</span> : null}
        <p className="text-xs font-medium uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function SmallCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
        {formatNumber(value)}
      </p>
    </div>
  );
}
