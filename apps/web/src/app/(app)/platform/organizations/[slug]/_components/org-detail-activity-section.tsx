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
import { formatDate } from "../_lib/helpers";
import type { OrgDetailWorkspaceProps } from "./org-detail-workspace";
import { InfoTile, SmallCount } from "./org-detail-ui";

export function OrgDetailActivitySection(props: OrgDetailWorkspaceProps) {
  const { org, statusParams, recentPayments, recentMembers, recentAuditLogs } = props;

  return (
    <>
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
    </>
  );
}
