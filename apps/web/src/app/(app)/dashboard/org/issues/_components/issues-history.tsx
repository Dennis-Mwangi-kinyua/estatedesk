import { DeferredLink } from "@/components/navigation/app-links";
import type { IssueStatusFilter, OrgIssue } from "../_lib/types";
import { IssueSlaBadge } from "@/components/issues/issue-sla-badge";
import {
  buildIssuesHref,
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";

export function IssuesHistory({
  issues,
  selectedIssueId,
  currentPage,
  activeFilter,
}: {
  issues: OrgIssue[];
  selectedIssueId?: string;
  currentPage: number;
  activeFilter: IssueStatusFilter;
}) {
  return (
    <>
      <div className="mt-5 space-y-3 2xl:hidden">
        {issues.map((issue) => {
          const selected = selectedIssueId === issue.id;

          return (
            <DeferredLink
              key={issue.id}
              href={buildIssuesHref(currentPage, issue.id, activeFilter, issue.title)}
              className={[
                "block rounded-[24px] border p-4 transition",
                selected
                  ? "border-neutral-900 bg-white shadow-sm"
                  : "border-border bg-muted/70",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-neutral-950">
                    {issue.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {getIssueUnitLabel(issue)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                      issue.status,
                    )}`}
                  >
                    {issue.status.replaceAll("_", " ")}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                      issue.priority,
                    )}`}
                  >
                    {issue.priority}
                  </span>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700">
                {issue.description}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <IssueDetail label="Property" value={issue.property?.name ?? "Property unavailable"} />
                <IssueDetail label="Unit" value={getIssueUnitLabel(issue)} />
                <IssueDetail label="Priority" value={issue.priority} />
                <IssueDetail label="Status" value={issue.status.replaceAll("_", " ")} />
                <IssueDetail label="Assigned to" value={issue.assignedTo?.fullName ?? issue.assignedTo?.email ?? "Unassigned"} />
                <IssueDetail label="Reported by" value={issue.reportedBy?.fullName ?? issue.reportedBy?.email ?? "Unknown"} />
                <IssueDetail label="Reported" value={formatDate(issue.createdAt)} />
                <IssueDetail label="Resolved" value={formatDate(issue.resolvedAt)} />
                <div className="min-w-0 rounded-2xl border border-border/70 bg-background px-3 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Response time</p>
                  <div className="mt-2"><IssueSlaBadge createdAt={issue.createdAt} priority={issue.priority} status={issue.status} /></div>
                </div>
              </div>
              {issue.resolutionNotes ? <IssueDetail label="Resolution notes" value={issue.resolutionNotes} className="mt-3" /> : null}
            </DeferredLink>
          );
        })}
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-[28px] border border-border bg-white 2xl:block">
        <table className="min-w-[1100px] text-sm">
          <thead className="border-b border-neutral-200 bg-muted/50">
            <tr className="text-left text-neutral-500">
              <th className="px-5 py-4 font-medium">Issue</th>
              <th className="px-5 py-4 font-medium">Unit</th>
              <th className="px-5 py-4 font-medium">Priority</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Allocated To</th>
              <th className="px-5 py-4 font-medium">Reported By</th>
              <th className="px-5 py-4 font-medium">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const selected = selectedIssueId === issue.id;

              return (
                <tr
                  key={issue.id}
                  className={`border-b border-neutral-100 last:border-0 ${
                    selected ? "bg-neutral-50" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <DeferredLink
                      href={buildIssuesHref(currentPage, issue.id, activeFilter, issue.title)}
                      className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                    >
                      {issue.title}
                    </DeferredLink>
                    <p className="mt-1 line-clamp-2 break-words text-neutral-500">{issue.description}</p>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {getIssueUnitLabel(issue)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(
                        issue.priority,
                      )}`}
                    >
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        issue.status,
                      )}`}
                    >
                      {issue.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {issue.assignedTo?.fullName ??
                      issue.assignedTo?.email ??
                      "Unassigned"}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {issue.reportedBy?.fullName ??
                      issue.reportedBy?.email ??
                      "Unknown"}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {formatDate(issue.resolvedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function IssueDetail({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`min-w-0 rounded-2xl border border-border/70 bg-background px-3 py-3 ${className}`}>
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-5 text-foreground">{value || "—"}</p>
  </div>;
}
