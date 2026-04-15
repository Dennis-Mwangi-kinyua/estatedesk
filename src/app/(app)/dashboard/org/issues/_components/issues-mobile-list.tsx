import Link from "next/link";
import { Wrench } from "lucide-react";
import type { OrgIssue } from "../_lib/types";
import {
  buildIssuesHref,
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";

type IssuesMobileListProps = {
  issues: OrgIssue[];
  selectedIssueId?: string;
  currentPage: number;
};

export function IssuesMobileList({
  issues,
  selectedIssueId,
  currentPage,
}: IssuesMobileListProps) {
  return (
    <div className="mt-5 space-y-3 lg:hidden">
      {issues.map((issue) => {
        const selected = selectedIssueId === issue.id;

        return (
          <div
            key={issue.id}
            className={`rounded-[22px] border p-4 ${
              selected
                ? "border-neutral-900 bg-white shadow-sm"
                : "border-black/5 bg-[#fafafa]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={buildIssuesHref(currentPage, issue.id)}
                  className="text-sm font-semibold text-neutral-950 underline-offset-4 hover:underline"
                >
                  {issue.title}
                </Link>
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

            <div className="mt-4 rounded-[16px] bg-white px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                Description
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {issue.description}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-[16px] bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-950">
                  {issue.status.replaceAll("_", " ")}
                </p>
              </div>

              <div className="rounded-[16px] bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Resolved
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-950">
                  {formatDate(issue.resolvedAt)}
                </p>
              </div>

              <div className="rounded-[16px] bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Allocated To
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-950">
                  {issue.assignedTo?.fullName ?? issue.assignedTo?.email ?? "Unassigned"}
                </p>
              </div>

              <div className="rounded-[16px] bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Reported By
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-950">
                  {issue.reportedBy?.fullName ?? issue.reportedBy?.email ?? "Unknown"}
                </p>
              </div>
            </div>

            {issue.resolutionNotes ? (
              <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                  Resolution Notes
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  {issue.resolutionNotes}
                </p>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={buildIssuesHref(currentPage, issue.id)}
                className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Wrench className="mr-2 h-4 w-4" />
                Open issue
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}