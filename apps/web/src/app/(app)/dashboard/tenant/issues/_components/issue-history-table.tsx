import { ResolutionForm } from "@/app/(app)/dashboard/tenant/issues/_components/resolution-form";
import {
  formatDate,
  getPriorityClasses,
  getStatusClasses,
} from "@/app/(app)/dashboard/tenant/issues/_lib/helpers";
import type { TenantIssue } from "@/app/(app)/dashboard/tenant/issues/_lib/types";

function getUnitLabel(issue: TenantIssue) {
  return issue.unit
    ? `${issue.unit.property.name} • Unit ${issue.unit.houseNo}`
    : (issue.property?.name ?? "Property issue");
}

export function IssueHistoryTable({ issues }: { issues: TenantIssue[] }) {
  return (
    <div className="mt-5 hidden overflow-hidden rounded-[24px] ed-theme-card border border-border bg-card lg:block">
      <table className="min-w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr className="text-left text-muted-foreground">
            <th className="px-5 py-4 font-medium">Issue</th>
            <th className="px-5 py-4 font-medium">Unit</th>
            <th className="px-5 py-4 font-medium">Priority</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Assigned To</th>
            <th className="px-5 py-4 font-medium">Created</th>
            <th className="px-5 py-4 font-medium">Resolved</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const unitLabel = getUnitLabel(issue);
            const latestReport = issue.resolutionReports[0] ?? null;

            return (
              <tr
                key={issue.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-5 py-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {issue.title}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {issue.description}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 text-neutral-600">{unitLabel}</td>
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
                  {issue.assignedTo?.fullName ?? "Unassigned"}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {formatDate(issue.createdAt)}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  <div className="space-y-2">
                    <p>{formatDate(issue.resolvedAt)}</p>
                    {latestReport?.status === "OFFICE_APPROVED" ? (
                      <ResolutionForm
                        issue={issue}
                        latestReport={latestReport}
                        compact
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}