import { OrgSurface } from "./org-detail-ui";
import { Receipt, UsersRound, Archive, Trash2, ChevronDown } from "lucide-react";
import {
  archiveOrganizationAction,
  permanentlyDeleteOrganizationAction,
} from "../actions";
import {
  Badge,
  formatCurrency,
  formatDateTime,
  labelize,
  toneForStatus,
} from "../../../_components/control-plane";
import type { OrgDetailWorkspaceProps } from "./org-detail-workspace";

export function OrgDetailActivitySection(props: OrgDetailWorkspaceProps) {
  const { org, statusParams, recentPayments, recentMembers, recentAuditLogs } = props;

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-2">
        <OrgSurface id="organisation-payments" title="Recent payments" description="Latest transactions and their payment status.">
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="org-activity-row grid gap-3 p-4 transition hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5">
                <div className="flex min-w-0 items-start gap-3"><span className="org-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Receipt aria-hidden="true" className="h-4 w-4" /></span><div className="min-w-0">
                  <p className="break-words font-medium leading-5 text-slate-950 dark:text-white">
                    {payment.payerTenant?.fullName ??
                      payment.payerUser?.fullName ??
                      payment.payerName ??
                      payment.payerType}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {payment.targetType} • {payment.reference ?? payment.externalReference ?? "-"}
                  </p>
                </div></div>
                <div className="min-w-0 text-left sm:text-right">
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
        </OrgSurface>

        <OrgSurface id="organisation-members" title="Recent members" description="Workspace roles and recent sign-in activity.">
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {recentMembers.map((member) => (
              <div key={member.id} className="org-activity-row grid gap-3 p-4 transition hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5">
                <div className="flex min-w-0 items-start gap-3"><span className="org-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UsersRound aria-hidden="true" className="h-4 w-4" /></span><div className="min-w-0">
                  <p className="break-words font-medium leading-5 text-slate-950 dark:text-white">
                    {member.user.fullName}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                    {member.user.email ?? "-"}
                  </p>
                </div></div>
                <div className="min-w-0 text-left sm:text-right">
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
        </OrgSurface>
      </section>

      <OrgSurface id="organisation-audit" title="Recent audit activity" description="A record of changes, actions and the people behind them.">
        <div className="divide-y divide-border md:hidden">
          {recentAuditLogs.map((log) => (
            <article key={log.id} className="space-y-2.5 px-3 py-3.5 sm:px-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold leading-5 text-foreground">
                    {log.actor.fullName}
                  </p>
                  <p className="mt-0.5 break-all text-xs text-muted-foreground">
                    {log.actor.email ?? "No email"}
                  </p>
                </div>
                <p className="text-left text-xs sm:text-right text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
              <Badge tone={toneForStatus(log.action)}>{labelize(log.action)}</Badge>
              <p className="break-all text-xs text-muted-foreground">
                {log.entityType} / {log.entityId}
              </p>
            </article>
          ))}
          {recentAuditLogs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No audit activity found.
            </p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
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
      </OrgSurface>

      <details className="rounded-2xl border border-border bg-card">
        <summary className="flex min-h-14 cursor-pointer items-center gap-3 px-5 py-4 text-sm font-semibold text-muted-foreground"><Archive aria-hidden="true" className="h-5 w-5" />Advanced organisation actions<ChevronDown aria-hidden="true" className="ml-auto h-4 w-4" /></summary>
      <OrgSurface
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
          <button data-workspace-action="true"
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 dark:hover:bg-amber-400/20 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
          >
            <Archive aria-hidden="true" className="mr-2 h-4 w-4" />Archive and terminate access
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
          <button data-workspace-action="true"
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-red-500 dark:text-white dark:hover:bg-red-400 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
          >
            <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />Permanently delete organization
          </button>
        </form>
      </OrgSurface>
      </details>
    </>
  );
}
