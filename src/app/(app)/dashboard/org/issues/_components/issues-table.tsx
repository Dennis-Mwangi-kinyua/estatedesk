import Link from "next/link";
import type { OrgIssue } from "../_lib/types";
import {
  buildIssuesHref,
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";

type IssuesTableProps = {
  issues: OrgIssue[];
  selectedIssueId?: string;
  currentPage: number;
};

export function IssuesTable({
  issues,
  selectedIssueId,
  currentPage,
}: IssuesTableProps) {
  return (
    <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-black/5 bg-white lg:block">
      <table className="min-w-full text-sm">
        <thead className="border-b border-neutral-200 bg-[#fcfcfd]">
          <tr className="text-left text-neutral-500">
            <th className="px-5 py-4 font-medium">Issue</th>
            <th className="px-5 py-4 font-medium">Unit</th>
            <th className="px-5 py-4 font-medium">Priority</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Allocated To</th>
            <th className="px-5 py-4 font-medium">Reported By</th>
            <th className="px-5 py-4 font-medium">Created</th>
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
                  <div>
                    <Link
                      href={buildIssuesHref(currentPage, issue.id)}
                      className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                    >
                      {issue.title}
                    </Link>
                    <p className="mt-1 text-neutral-500">{issue.description}</p>
                  </div>
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
                  {issue.assignedTo?.fullName ?? issue.assignedTo?.email ?? "Unassigned"}
                </td>

                <td className="px-5 py-4 text-neutral-600">
                  {issue.reportedBy?.fullName ?? issue.reportedBy?.email ?? "Unknown"}
                </td>

                <td className="px-5 py-4 text-neutral-600">
                  {formatDate(issue.createdAt)}
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
  );
}