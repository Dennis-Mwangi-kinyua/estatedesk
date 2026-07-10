import { Fragment } from "react";
import type { IntegrationReadinessReport } from "@/lib/integrations";
import {
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  labelize,
  toneForStatus,
} from "../../_components/control-plane";
import {
  queueKraRetryAction,
  retryAllFailedNotificationsAction,
  retryFailedNotificationAction,
  runNotificationsJobAction,
  runRetentionJobAction,
} from "../actions";
import { JobActionButton } from "../job-action-controls";
import type { JobsPageData } from "../_lib/queries";
import type { JobsPageInput } from "../_lib/types";
import { DEFAULT_PAGE_SIZE } from "../_lib/types";
import { formatAge, formatJson, readProviderError } from "../_lib/helpers";
import { HiddenReturnTo, MobileEmpty, MobileField, SectionPager } from "./jobs-ui";

export type JobsWorkspaceProps = {
  data: JobsPageData;
  filters: JobsPageInput;
  queryParams: URLSearchParams;
  returnTo: string;
  integrationReadiness: IntegrationReadinessReport;
};

export function JobsQueuesSection({
  data,
  filters,
  queryParams,
  returnTo,
}: JobsWorkspaceProps) {
  const {
    queued,
    failed,
    queuedTotal,
    queuedNotifications,
    failedTotal,
    failedNotifications,
    retryableKra,
    retryableKraTotal,
    retryableKraAttempts,
  } = data;
  const { pageSize, queuedPage, failedPage, kraPage } = filters;

  return (
    <>
      <Surface title="Queued notification backlog">
        <div className="grid gap-3 p-4 md:hidden">
          {queuedNotifications.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">{item.org.name}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.title}</p>
                </div>
                <Badge tone={toneForStatus(item.status)}>{item.channel}</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileField label="Recipient">{item.tenant?.fullName ?? item.user?.fullName ?? "-"}</MobileField>
                <MobileField label="Type">{labelize(item.type)}</MobileField>
                <div className="grid grid-cols-2 gap-3">
                  <MobileField label="Age">{formatAge(item.createdAt)}</MobileField>
                  <MobileField label="Created">{formatDateTime(item.createdAt)}</MobileField>
                </div>
              </div>
            </article>
          ))}
          {queuedNotifications.length === 0 ? <MobileEmpty label="No queued notifications found." /> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {queuedNotifications.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3 font-medium">{item.org.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.tenant?.fullName ?? item.user?.fullName ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{labelize(item.type)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.channel}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.title}</td>
                  <td className="px-4 py-3 font-medium">{formatAge(item.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {queuedNotifications.length === 0 ? <EmptyRow colSpan={7} label="No queued notifications found." /> : null}
            </tbody>
          </table>
        </div>
        <SectionPager page={queuedPage} pageSize={pageSize} total={queuedTotal} pageKey="queuedPage" params={queryParams} />
      </Surface>

      <Surface
        title="Failed notification queue"
        description="Failed records can be requeued for the next notification job run after the cause is corrected."
      >
        <div className="border-b border-slate-100 p-4 dark:border-white/10">
          <form action={retryAllFailedNotificationsAction}>
            <HiddenReturnTo value={returnTo} />
            <JobActionButton
              variant="danger"
              pendingLabel="Requeueing..."
              confirmMessage={`Retry all ${formatNumber(failed)} failed notifications?`}
            >
              Retry all failed
            </JobActionButton>
          </form>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {failedNotifications.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">{item.org.name}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.title}</p>
                </div>
                <Badge tone={toneForStatus(item.status)}>{item.channel}</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileField label="Recipient">{item.tenant?.fullName ?? item.user?.fullName ?? "-"}</MobileField>
                <MobileField label="Type">{labelize(item.type)}</MobileField>
                <MobileField label="Error">{readProviderError(item.providerResponse)}</MobileField>
                <div className="flex items-center justify-between gap-3">
                  <MobileField label="Age">{formatAge(item.createdAt)}</MobileField>
                  <form action={retryFailedNotificationAction}>
                    <HiddenReturnTo value={returnTo} />
                    <input type="hidden" name="notificationId" value={item.id} />
                    <JobActionButton variant="secondary" pendingLabel="Retrying...">
                      Retry
                    </JobActionButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
          {failedNotifications.length === 0 ? <MobileEmpty label="No failed notifications found." /> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Error</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {failedNotifications.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3 font-medium">{item.org.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.tenant?.fullName ?? item.user?.fullName ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{labelize(item.type)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.channel}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.title}</td>
                  <td className="max-w-md px-4 py-3 text-slate-600 dark:text-slate-300">{readProviderError(item.providerResponse)}</td>
                  <td className="px-4 py-3 font-medium">{formatAge(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <form action={retryFailedNotificationAction}>
                      <HiddenReturnTo value={returnTo} />
                      <input type="hidden" name="notificationId" value={item.id} />
                      <JobActionButton variant="secondary" pendingLabel="Retrying...">
                        Retry
                      </JobActionButton>
                    </form>
                  </td>
                </tr>
              ))}
              {failedNotifications.length === 0 ? <EmptyRow colSpan={8} label="No failed notifications found." /> : null}
            </tbody>
          </table>
        </div>
        <SectionPager page={failedPage} pageSize={pageSize} total={failedTotal} pageKey="failedPage" params={queryParams} />
      </Surface>

      <Surface title="KRA retryable attempts">
        <div className="grid gap-3 p-4 md:hidden">
          {retryableKraAttempts.map((attempt) => (
            <article key={attempt.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">{attempt.rentalReturn.org.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{attempt.rentalReturn.filingKey}</p>
                </div>
                <Badge tone={toneForStatus(attempt.rentalReturn.status)}>{attempt.rentalReturn.status}</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileField label="Return">{attempt.rentalReturn.period}</MobileField>
                <MobileField label="Property">{attempt.rentalReturn.property?.name ?? "-"}</MobileField>
                <div className="grid grid-cols-2 gap-3">
                  <MobileField label="Channel">{labelize(attempt.channel)}</MobileField>
                  <MobileField label="HTTP">{attempt.httpStatus ?? "-"}</MobileField>
                </div>
                <MobileField label="Attempted">{formatDateTime(attempt.attemptedAt)}</MobileField>
                {attempt.errorMessage ? <MobileField label="Error">{attempt.errorMessage}</MobileField> : null}
                <form action={queueKraRetryAction}>
                  <HiddenReturnTo value={returnTo} />
                  <input type="hidden" name="attemptId" value={attempt.id} />
                  <JobActionButton variant="secondary" pendingLabel="Queueing...">
                    Queue retry
                  </JobActionButton>
                </form>
              </div>
            </article>
          ))}
          {retryableKraAttempts.length === 0 ? <MobileEmpty label="No retryable KRA attempts found." /> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Return</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">HTTP</th>
                <th className="px-4 py-3 font-medium">Attempted</th>
                <th className="px-4 py-3 font-medium">Error</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {retryableKraAttempts.map((attempt) => (
                <tr key={attempt.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3 font-medium">{attempt.rentalReturn.org.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <p>{attempt.rentalReturn.period}</p>
                    <p className="mt-1 text-xs text-slate-500">{attempt.rentalReturn.filingKey}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{attempt.rentalReturn.property?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{labelize(attempt.channel)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{attempt.httpStatus ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(attempt.attemptedAt)}</td>
                  <td className="max-w-md px-4 py-3 text-slate-600 dark:text-slate-300">{attempt.errorMessage ?? "-"}</td>
                  <td className="px-4 py-3">
                    <form action={queueKraRetryAction}>
                      <HiddenReturnTo value={returnTo} />
                      <input type="hidden" name="attemptId" value={attempt.id} />
                      <JobActionButton variant="secondary" pendingLabel="Queueing...">
                        Queue retry
                      </JobActionButton>
                    </form>
                  </td>
                </tr>
              ))}
              {retryableKraAttempts.length === 0 ? <EmptyRow colSpan={8} label="No retryable KRA attempts found." /> : null}
            </tbody>
          </table>
        </div>
        <SectionPager page={kraPage} pageSize={pageSize} total={retryableKraTotal} pageKey="kraPage" params={queryParams} />
      </Surface>
    </>
  );
}
