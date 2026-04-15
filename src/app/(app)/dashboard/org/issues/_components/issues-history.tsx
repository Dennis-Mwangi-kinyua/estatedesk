import Link from "next/link";
import type { OrgIssue } from "../_lib/types";
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
}: {
  issues: OrgIssue[];
  selectedIssueId?: string;
  currentPage: number;
}) {
  return (
    <>
      <div className="mt-5 space-y-3 lg:hidden">
        {issues.map((issue) => {
          const selected = selectedIssueId === issue.id;

          return (
            <Link
              key={issue.id}
              href={buildIssuesHref(currentPage, issue.id)}
              className={[
                "block rounded-[24px] border p-4 transition",
                selected
                  ? "border-neutral-900 bg-white shadow-sm"
                  : "border-black/5 bg-[#fafafa]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-950">
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

              <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">
                {issue.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[18px] bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                    Allocated To
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-950">
                    {issue.assignedTo?.fullName ??
                      issue.assignedTo?.email ??
                      "Unassigned"}
                  </p>
                </div>

                <div className="rounded-[18px] bg-white px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                    Resolved
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-950">
                    {formatDate(issue.resolvedAt)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-[28px] border border-black/5 bg-white lg:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-200 bg-[#fcfcfd]">
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
                    <Link
                      href={buildIssuesHref(currentPage, issue.id)}
                      className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                    >
                      {issue.title}
                    </Link>
                    <p className="mt-1 text-neutral-500">{issue.description}</p>
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